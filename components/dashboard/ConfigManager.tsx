"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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
  const [linkName, setLinkName] = useState("");
  const [linkPhone, setLinkPhone] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyUserId, setVerifyUserId] = useState(selectedElderlyId ?? elderlyUsers[0]?.id ?? "");
  const [testText, setTestText] = useState("Hi there! Let me walk you through that one step at a time.");
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const [testing, setTesting] = useState(false);

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

  async function linkUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLinking(true);
    setStatus(null);
    const res = await fetch("/api/dashboard/elderly", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: linkName, phone: linkPhone }),
    });
    const payload = await res.json();
    if (res.ok) {
      setStatus({ text: "Code sent. Ask them to reply to the text.", ok: true });
      setLinkName("");
      setLinkPhone("");
      router.refresh();
      if (payload.elderly_user_id) setVerifyUserId(payload.elderly_user_id);
    } else {
      setStatus({ text: payload.error ?? "Unable to link user.", ok: false });
    }
    setLinking(false);
  }

  async function verifyUser() {
    if (!verifyUserId || !verifyCode.trim()) return;
    setStatus(null);
    const res = await fetch("/api/dashboard/elderly/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ elderly_user_id: verifyUserId, code: verifyCode }),
    });
    const payload = await res.json();
    if (res.ok && payload.verified) {
      setStatus({ text: "User verified.", ok: true });
      setVerifyCode("");
      router.refresh();
    } else {
      setStatus({ text: payload.error ?? "Verification code did not match.", ok: false });
    }
  }

  async function testVoice() {
    if (!config || !selectedElderlyId) return;
    setTesting(true);
    setStatus(null);
    const res = await fetch("/api/dashboard/test-voice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ elderly_user_id: selectedElderlyId, text: testText, config }),
    });
    if (!res.ok) {
      const payload = await res.json();
      setStatus({ text: payload.error ?? "Voice test failed.", ok: false });
      setTesting(false);
      return;
    }
    const blob = await res.blob();
    const nextUrl = URL.createObjectURL(blob);
    setAudioUrl((cur) => { if (cur) URL.revokeObjectURL(cur); return nextUrl; });
    setStatus({ text: "Voice sample ready.", ok: true });
    setTesting(false);
  }

  const selectClass = "w-full rounded-xl border border-[#e8e4de] bg-white px-4 py-2.5 text-sm text-[#1a1208] outline-none focus:border-[#e8733b] focus:ring-2 focus:ring-[#e8733b]/20 transition";

  return (
    <div className="space-y-6">
      {/* Linked users */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#1a1208]">Linked users</h2>
            <p className="mt-0.5 text-sm text-[#888]">Manage who Coco is looking after.</p>
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
            <p className="text-sm text-[#888] col-span-2">No users linked yet.</p>
          )}
        </div>
      </Card>

      {/* Link new user */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-[#1a1208] mb-4">Link a new user</h2>
        <form onSubmit={linkUser} className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="Harold" />
          <Input label="Phone" value={linkPhone} onChange={(e) => setLinkPhone(e.target.value)} placeholder="+1 (555) 843-2201" />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={linking || !linkName || !linkPhone}>
              {linking ? "Sending…" : "Send verification SMS"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Manual verify */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-[#1a1208] mb-4">Manual verify</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1a1208]">User</label>
            <select
              className={selectClass}
              value={verifyUserId}
              onChange={(e) => setVerifyUserId(e.target.value)}
            >
              <option value="">Select a user</option>
              {elderlyUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Verification code"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            placeholder="123456"
          />
          <Button type="button" onClick={() => void verifyUser()} disabled={!verifyUserId || !verifyCode}>
            Verify
          </Button>
        </div>
      </Card>

      {/* Agent config */}
      {!config ? (
        <Card className="p-6">
          <p className="text-sm text-[#888]">Link a user first to unlock agent configuration.</p>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-[#1a1208]">Agent configuration</h2>
              <p className="mt-0.5 text-sm text-[#888]">Tune voice, pacing, and teaching style.</p>
            </div>
            <Button onClick={() => void saveConfig()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-1.5">
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

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#1a1208]">Speaking speed</label>
                <span className="text-sm font-medium text-[#e8733b]">{config.tts_speed.toFixed(1)}x</span>
              </div>
              <input
                type="range" min="0.5" max="1.5" step="0.1"
                value={config.tts_speed}
                onChange={(e) => setConfig({ ...config, tts_speed: Number(e.target.value) })}
                className="w-full accent-[#e8733b]"
              />
              <div className="flex justify-between">
                <span className="text-xs text-[#888]">Slower</span>
                <span className="text-xs text-[#888]">Faster</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#1a1208]">Repetition level</label>
                <span className="text-sm font-medium text-[#e8733b]">{config.repetition_level}</span>
              </div>
              <input
                type="range" min="1" max="5" step="1"
                value={config.repetition_level}
                onChange={(e) => setConfig({ ...config, repetition_level: Number(e.target.value) })}
                className="w-full accent-[#e8733b]"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#e8e4de] px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-[#1a1208]">Metaphor-Teaching Mode</p>
                <p className="text-xs text-[#888] mt-0.5">"Think of this like your TV remote…"</p>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, metaphor_mode: !config.metaphor_mode })}
                className={`relative h-6 w-11 rounded-full transition-colors ${config.metaphor_mode ? "bg-[#e8733b]" : "bg-[#d0cdc8]"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.metaphor_mode ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Voice test */}
          <div className="mt-6 rounded-xl bg-[#f5f4f0] p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#1a1208]">Test agent voice</p>
                <p className="text-xs text-[#888] mt-0.5">Preview how Coco will sound with your settings.</p>
              </div>
              <Button variant="outline" type="button" onClick={() => void testVoice()} disabled={testing}>
                {testing ? "Generating…" : "Play sample"}
              </Button>
            </div>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[#e8e4de] bg-white px-4 py-3 text-sm text-[#1a1208] placeholder:text-[#bbb] outline-none focus:border-[#e8733b] focus:ring-2 focus:ring-[#e8733b]/20 transition resize-none"
            />
            {audioUrl && <audio controls src={audioUrl} className="w-full" />}
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
