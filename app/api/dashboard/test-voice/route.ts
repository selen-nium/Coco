import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireOwnedElderlyUser, responseForError } from "@/app/api/dashboard/_lib/auth";
import { testVoiceSchema } from "@/app/api/dashboard/_lib/schemas";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export async function POST(req: NextRequest) {
  try {
    const body = testVoiceSchema.parse(await req.json());
    await requireOwnedElderlyUser(body.elderly_user_id);

    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${body.config.elevenlabs_voice_id}`,
      {
        method: "POST",
        headers: {
          accept: "audio/mpeg",
          "content-type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text: body.text,
          model_id: "eleven_multilingual_v2",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: "ElevenLabs synthesis failed", details: errorText },
        { status: 502 }
      );
    }

    const audio = await response.arrayBuffer();

    return new Response(audio, {
      status: 200,
      headers: {
        "content-type": "audio/mpeg",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Invalid voice test payload", details: error.flatten() },
        { status: 400 }
      );
    }

    return responseForError(error);
  }
}
