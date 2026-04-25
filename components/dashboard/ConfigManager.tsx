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
  const [testText, setTestText] = useState("Hi there. Let me walk you through that one step at a time.");
  const [status, setStatus] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const [testing, setTesting] = useState(false);

  async function saveConfig() {
    if (!config || !selectedElderlyId) return;
    setSaving(true);
    setStatus(null);
    const response = await fetch(`/api/dashboard/config/${selectedElderlyId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(config),
    });

    if (response.ok) {
      const payload = await response.json();
      setConfig(payload);
      setStatus("Configuration saved.");
    } else {
      const payload = await response.json();
      setStatus(payload.error ?? "Unable to save configuration.");
    }

    setSaving(false);
  }

  async function linkUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLinking(true);
    setStatus(null);
    const response = await fetch("/api/dashboard/elderly", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: linkName, phone: linkPhone }),
    });

    const payload = await response.json();
    if (response.ok) {
      setStatus("Code sent. Ask them to reply to the text.");
      setLinkName("");
      setLinkPhone("");
      router.refresh();
      if (payload.elderly_user_id) {
        setVerifyUserId(payload.elderly_user_id);
      }
    } else {
      setStatus(payload.error ?? "Unable to link user.");
    }
    setLinking(false);
  }

  async function verifyUser() {
    if (!verifyUserId || !verifyCode.trim()) return;
    setStatus(null);
    const response = await fetch("/api/dashboard/elderly/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ elderly_user_id: verifyUserId, code: verifyCode }),
    });
    const payload = await response.json();
    if (response.ok && payload.verified) {
      setStatus("User verified.");
      setVerifyCode("");
      router.refresh();
    } else {
      setStatus(payload.error ?? "Verification code did not match.");
    }
  }

  async function testVoice() {
    if (!config || !selectedElderlyId) return;
    setTesting(true);
    setStatus(null);
    const response = await fetch("/api/dashboard/test-voice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        elderly_user_id: selectedElderlyId,
        text: testText,
        config,
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.error ?? "Voice test failed.");
      setTesting(false);
      return;
    }

    const audioBlob = await response.blob();
    const nextUrl = URL.createObjectURL(audioBlob);
    setAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextUrl;
    });
    setStatus("Voice sample ready.");
    setTesting(false);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Linked Users</h2>
            <p className="mt-1 text-sm text-slate-500">
              Link an elderly user, then choose who you want to configure.
            </p>
          </div>
          {elderlyUsers.length > 0 ? (
            <select
              value={selectedElderlyId ?? ""}
              onChange={(event) =>
                router.push(`/dashboard/config?elderlyId=${event.target.value}`)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {elderlyUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {elderlyUsers.map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{user.name}</p>
                <Badge tone={user.verified ? "success" : "high"}>
                  {user.verified ? "Verified" : "Pending"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-500">{user.phone}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Link a New User</h2>
        <form onSubmit={linkUser} className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="Name"
            value={linkName}
            onChange={(event) => setLinkName(event.target.value)}
            placeholder="Grace Lee"
          />
          <Input
            label="Phone"
            value={linkPhone}
            onChange={(event) => setLinkPhone(event.target.value)}
            placeholder="+1 206 555 0199"
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={linking}>
              {linking ? "Sending code..." : "Send Verification Code"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Manual Verify</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr_auto]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">User</span>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              value={verifyUserId}
              onChange={(event) => setVerifyUserId(event.target.value)}
            >
              <option value="">Select a user</option>
              {elderlyUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Verification Code"
            value={verifyCode}
            onChange={(event) => setVerifyCode(event.target.value)}
            placeholder="123456"
          />
          <div className="flex items-end">
            <Button onClick={() => void verifyUser()} type="button">
              Verify
            </Button>
          </div>
        </div>
      </Card>

      {!config ? (
        <Card className="p-6">
          <p className="text-sm text-slate-500">
            Link an elderly user first to unlock voice configuration.
          </p>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Agent Configuration</h2>
              <p className="mt-1 text-sm text-slate-500">
                Tune how the voice agent explains, repeats, and teaches.
              </p>
            </div>
            <Button onClick={() => void saveConfig()} disabled={saving}>
              {saving ? "Saving..." : "Save Config"}
            </Button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Voice</span>
              <select
                value={config.elevenlabs_voice_id}
                onChange={(event) =>
                  setConfig({ ...config, elevenlabs_voice_id: event.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                {(voices.length ? voices : [{ voice_id: "default", name: "Default Voice" }]).map(
                  (voice) => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                TTS Speed: {config.tts_speed.toFixed(1)}x
              </span>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={config.tts_speed}
                onChange={(event) =>
                  setConfig({ ...config, tts_speed: Number(event.target.value) })
                }
                className="w-full"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Repetition Level: {config.repetition_level}
              </span>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={config.repetition_level}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    repetition_level: Number(event.target.value),
                  })
                }
                className="w-full"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Metaphor Mode</p>
                <p className="text-sm text-slate-500">
                  Use friendly analogies to explain technical steps.
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.metaphor_mode}
                onChange={(event) =>
                  setConfig({ ...config, metaphor_mode: event.target.checked })
                }
                className="h-5 w-5 accent-emerald-600"
              />
            </label>
          </div>

          <div className="mt-8 space-y-4 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Live Test Chatbox</p>
                <p className="text-sm text-slate-500">
                  Send a sample prompt and preview the current voice.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => void testVoice()} disabled={testing}>
                {testing ? "Generating..." : "Generate Sample"}
              </Button>
            </div>
            <textarea
              value={testText}
              onChange={(event) => setTestText(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"
            />
            {audioUrl ? <audio controls src={audioUrl} className="w-full" /> : null}
          </div>
        </Card>
      )}

      {status ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {status}
        </p>
      ) : null}
    </div>
  );
}
