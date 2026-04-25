import { requireAuthenticatedCaretaker } from "@/app/api/dashboard/_lib/auth";
import { getAgentVoices } from "@/lib/elevenlabs/client";
import { ConfigManager } from "@/components/dashboard/ConfigManager";

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ elderlyId?: string }>;
}) {
  const { elderlyId } = await searchParams;
  const { supabase, caretaker } = await requireAuthenticatedCaretaker();
  const { data: elderlyUsers } = await supabase
    .from("elderly_users")
    .select("id, name, phone, verified")
    .eq("caretaker_id", caretaker.id)
    .order("created_at", { ascending: false });

  const selectedElderlyId = elderlyId ?? elderlyUsers?.[0]?.id ?? null;
  const { data: initialConfig } = selectedElderlyId
    ? await supabase
        .from("agent_configs")
        .select("*")
        .eq("elderly_user_id", selectedElderlyId)
        .maybeSingle()
    : { data: null };

  let voices: Awaited<ReturnType<typeof getAgentVoices>> = [];
  try {
    voices = await getAgentVoices();
  } catch (error) {
    console.error("[dashboard/config] failed to load voices", error);
  }

  const config =
    initialConfig && selectedElderlyId
      ? {
          elderly_user_id: selectedElderlyId,
          elevenlabs_voice_id: initialConfig.elevenlabs_voice_id,
          tts_speed: initialConfig.tts_speed,
          repetition_level: initialConfig.repetition_level,
          metaphor_mode: initialConfig.metaphor_mode,
          allow_sensitive_flows: initialConfig.allow_sensitive_flows,
        }
      : selectedElderlyId
        ? {
            elderly_user_id: selectedElderlyId,
            elevenlabs_voice_id: voices[0]?.voice_id ?? "default",
            tts_speed: 1,
            repetition_level: 2,
            metaphor_mode: false,
            allow_sensitive_flows: false,
          }
        : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-700">
          Configuration
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">
          Tune the AI agent for each linked user
        </h1>
      </div>

      <ConfigManager
        key={`${selectedElderlyId ?? "none"}-${elderlyUsers?.length ?? 0}`}
        elderlyUsers={elderlyUsers ?? []}
        selectedElderlyId={selectedElderlyId}
        initialConfig={config}
        voices={voices}
      />
    </div>
  );
}
