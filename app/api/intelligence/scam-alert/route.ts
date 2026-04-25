import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { safetyModel } from "@/lib/gemini/client";
import { SCAM_DETECTION_PROMPT } from "@/lib/gemini/prompts";
import { createServiceClient } from "@/lib/supabase/server";
import { twilioClient, TWILIO_PHONE_NUMBER } from "@/lib/twilio/client";

const scamAlertSchema = z.object({
  call_sid: z.string().min(1),
  elderly_user_id: z.string().uuid().optional(),
  speaker: z.enum(["agent", "user"]).optional(),
  text: z.string().optional(),
  transcript_excerpt: z.string().optional(),
});

const scamDetectionResultSchema = z.object({
  is_scam: z.boolean(),
  severity: z.enum(["high", "critical"]).nullable(),
  detected_keywords: z.array(z.string()).default([]),
  excerpt: z.string().optional(),
});

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  return match?.[0] ?? text;
}

async function handleScamAlert(rawPayload: unknown) {
  const payload = scamAlertSchema.parse(rawPayload);

  if (payload.speaker && payload.speaker !== "user") {
    return { flagged: false };
  }

  const transcriptExcerpt = payload.transcript_excerpt ?? payload.text ?? "";
  if (!transcriptExcerpt.trim()) {
    return { flagged: false };
  }

  const supabase = await createServiceClient();
  const { data: callLog, error: callLogError } = await supabase
    .from("call_logs")
    .select("id, elderly_user_id")
    .eq("twilio_call_sid", payload.call_sid)
    .maybeSingle();

  if (callLogError || !callLog) {
    throw callLogError ?? new Error("Call log not found");
  }

  const elderlyUserId = payload.elderly_user_id ?? callLog.elderly_user_id;

  const result = await safetyModel.generateContent(
    `${SCAM_DETECTION_PROMPT}\n\nTranscript excerpt:\n${transcriptExcerpt}`
  );

  const parsed = scamDetectionResultSchema.parse(
    JSON.parse(extractJson(result.response.text()))
  );

  if (!parsed.is_scam || !parsed.severity) {
    return { flagged: false };
  }

  const { data: alert, error: alertError } = await supabase
    .from("scam_alerts")
    .insert({
      call_log_id: callLog.id,
      elderly_user_id: elderlyUserId,
      detected_keywords: parsed.detected_keywords,
      severity: parsed.severity,
    })
    .select("id")
    .single();

  if (alertError || !alert) {
    throw alertError ?? new Error("Failed to create scam alert");
  }

  const { data: elderlyUser, error: elderlyUserError } = await supabase
    .from("elderly_users")
    .select("name, caretaker:caretaker_id(name, phone)")
    .eq("id", elderlyUserId)
    .single();

  if (elderlyUserError || !elderlyUser) {
    throw elderlyUserError ?? new Error("Failed to load caretaker phone");
  }

  const caretaker = elderlyUser.caretaker as { name: string; phone: string } | { name: string; phone: string }[] | null;
  const caretakerPhone = Array.isArray(caretaker)
    ? caretaker[0]?.phone
    : caretaker?.phone;

  if (caretakerPhone) {
    await twilioClient.messages.create({
      body: `[URGENT] Possible scam detected during ${elderlyUser.name}'s call. Keywords: ${parsed.detected_keywords.join(", ") || "none"}. Call them now or log in to Coco to listen.`,
      from: TWILIO_PHONE_NUMBER,
      to: caretakerPhone,
    });

    await supabase
      .from("scam_alerts")
      .update({ sms_sent_at: new Date().toISOString() })
      .eq("id", alert.id);
  }

  await Promise.all([
    supabase.from("intervention_logs").insert({
      call_log_id: callLog.id,
      type: "scam",
      metadata: {
        keywords: parsed.detected_keywords,
        severity: parsed.severity,
        excerpt: parsed.excerpt ?? transcriptExcerpt,
      },
    }),
    supabase
      .from("call_logs")
      .update({ status: "escalated" })
      .eq("id", callLog.id),
  ]);

  return { flagged: true };
}

// POST /api/intelligence/scam-alert
// Called asynchronously per transcript chunk by Agent 1.
// Gemini 2.5 Flash analyzes for scam signals; triggers caretaker SMS + DB alert if detected.
// Agent 2 owns this route.
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const detectionPromise = handleScamAlert(payload).catch((error) => {
      console.error("[intelligence/scam-alert]", error);
      return { flagged: false };
    });

    const result = await Promise.race([
      detectionPromise,
      new Promise<{ flagged: false }>((resolve) =>
        setTimeout(() => resolve({ flagged: false }), 150)
      ),
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[intelligence/scam-alert]", error);
    return NextResponse.json({ flagged: false }, { status: 200 });
  }
}
