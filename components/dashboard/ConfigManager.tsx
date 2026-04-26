"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ElderlyUser = {
  id: string;
  name: string;
  phone: string;
  verified: boolean;
};

type Voice = {
  voice_id: string;
  name: string;
  preview_url?: string;
};

type Config = {
  elderly_user_id: string;
  elevenlabs_voice_id: string;
  tts_speed: number;
  repetition_level: number;
  metaphor_mode: boolean;
  allow_sensitive_flows: boolean;
};

export function ConfigManager({
  elderlyUsers,
  selectedElderlyId,
  initialConfig,
  voices,
}: {
  elderlyUsers: ElderlyUser[];
  selectedElderlyId: string | null;
  initialConfig: Config | null;
  voices: Voice[];
}) {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(initialConfig);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const selectClass = "w-full rounded-xl border border-[#e8e4de] bg-white px-4 py-2.5 text-sm text-[#1a1208] outline-none focus:border-[#e8733b] focus:ring-2 focus:ring-[#e8733b]/20 transition";

  async function saveConfig() {
    if (!config || !selectedElderlyId) return;
    setSaving(true);
    setStatus(null);
    const res = await fetch(`/api/dashboard/config/${selectedElderlyId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(config),
    });
    const payload = await res.json();
    if (res.ok) {
      setConfig(payload);
      setStatus({ text: "Configuration saved.", ok: true });
    } else {
      setStatus({ text: payload.error ?? "Unable to save configuration.", ok: false });
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Linked users — read only */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#1a1208]">Linked users</h2>
            <p className="mt-0.5 text-sm text-[#888]">Users Coco is currently looking after.</p>
          </div>
          {elderlyUsers.length > 1 && (
            <select
              value={selectedElderlyId ?? ""}
              onChange={(e) => router.push(`/dashboard/config?elderlyId=${e.target.value}`)}
              className={selectClass + " max-w-[160px]"}
            >
              {elderlyUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {elderlyUsers.map((user) => (
            <div key={user.id} className="rounded-xl border border-[#e8e4de] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#1a1208]">{user.name}</p>
                <Badge variant={user.verified ? "green" : "amber"}>
                  {user.verified ? "Verified" : "Pending"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[#888]">{user.phone}</p>
            </div>
          ))}
          {elderlyUsers.length === 0 && (
            <p className="text-sm text-[#888] col-span-2">
              No users linked yet. Complete onboarding to link your first user.
            </p>
          )}
        </div>
      </Card>

      {/* Agent config */}
      {!config ? (
        <Card className="p-6">
          <p className="text-sm text-[#888]">No linked user selected. Agent settings will appear here once a user is linked.</p>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-[#1a1208]">Agent configuration</h2>
              <p className="mt-0.5 text-sm text-[#888]">Choose a voice for Coco. Coco changes speed dynamically based on the level of the user.</p>
            </div>
            <Button onClick={() => void saveConfig()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>

          <div className="grid gap-6">
            <div className="flex flex-col gap-1.5 max-w-md">
              <label className="text-sm font-medium text-[#1a1208]">Voice</label>
              <select
                value={config.elevenlabs_voice_id}
                onChange={(e) => setConfig({ ...config, elevenlabs_voice_id: e.target.value })}
                className={selectClass}
              >
                {(voices.length ? voices : [{ voice_id: "default", name: "Default Voice" }]).map((v) => (
                  <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {status && (
        <div className={`rounded-xl px-4 py-3 text-sm ${status.ok ? "bg-[#e8f3ee] text-[#2d6a4f]" : "bg-red-50 text-red-700"}`}>
          {status.text}
        </div>
      )}
    </div>
  );
}
