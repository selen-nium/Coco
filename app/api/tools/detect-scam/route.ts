import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { extractJsonBlock, generateText } from "@/lib/gemini/client";
import { buildScamDetectionPrompt } from "@/lib/gemini/prompts";
import { mergeScamAlertState } from "@/lib/gemini/intelligence-utils.mjs";

const requestSchema = z.object({
  transcript_chunk: z.string().trim().min(1),
  call_log_id: z.string().uuid(),
  elderly_user_id: z.string().uuid(),
});

const responseSchema = z.object({
  scam_detected: z.boolean(),
  confidence: z.number().min(0).max(1),
  keywords: z.array(z.string()),
  severity: z.enum(["high", "critical"]),
});

export async function POST(req: NextRequest) {
  try {
    const { transcript_chunk, call_log_id, elderly_user_id } = requestSchema.parse(
      await req.json()
    );
    console.log("[detect-scam] Analyzing chunk for call:", call_log_id);
    
    const supabase = await createServiceClient();

    const raw = await generateText(buildScamDetectionPrompt(transcript_chunk));
    const result = responseSchema.parse(extractJsonBlock(raw));

    if (result.scam_detected) {
      console.log(`[detect-scam] Scam detected! Confidence: ${result.confidence} Severity: ${result.severity}`);
      console.log(`[detect-scam] Keywords: ${result.keywords.join(", ")}`);
      
      const { data: existing } = await supabase
        .from("scam_alerts")
        .select("id, detected_keywords, severity")
        .eq("call_log_id", call_log_id)
        .eq("status", "active")
        .maybeSingle();

      if (existing) {
        const merged = mergeScamAlertState(
          existing.detected_keywords,
          existing.severity,
          result.keywords,
          result.severity
        );

        await supabase
          .from("scam_alerts")
          .update({
            detected_keywords: merged.detected_keywords,
            severity: merged.severity,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("scam_alerts").insert({
          call_log_id,
          elderly_user_id,
          detected_keywords: result.keywords,
          severity: result.severity,
          status: "active",
        });
      }
    } else {
      console.log("[detect-scam] No scam detected in this chunk.");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[tools/detect-scam] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
