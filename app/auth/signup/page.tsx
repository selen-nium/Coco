"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { PhoneModelSelect } from "@/components/ui/PhoneModelSelect";
import { Switch } from "@/components/ui/Switch";

type Step = 1 | 2 | "2verify" | 3;

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface ElderlyData {
  name: string;
  age: string;
  phone: string;
  nickname: string;
  phoneModel: string;
}

interface AgentData {
  voice: "warm-female" | "calm-male";
  speed: number;
  metaphor: boolean;
}

const STEP_LABELS = ["Your profile", "Link loved one", "Set up agent"];

function StepIndicator({ current }: { current: Step }) {
  const currentNum = current === "2verify" ? 2 : (current as number);
  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < currentNum;
        const active = stepNum === currentNum;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${done ? "bg-[#2d6a4f] text-white" : active ? "bg-[#e8733b] text-white" : "bg-[#e8e4de] text-[#aaa]"}`}>
                {done ? "✓" : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2C5.79 2 4 3.79 4 6c0 1.48.81 2.77 2 3.46V10h4V9.46C11.19 8.77 12 7.48 12 6c0-2.21-1.79-4-4-4z" fill="currentColor" opacity=".8"/>
                    <rect x="6" y="10" width="4" height="1.2" rx=".6" fill="currentColor" opacity=".6"/>
                    <rect x="6.5" y="11.5" width="3" height=".8" rx=".4" fill="currentColor" opacity=".4"/>
                  </svg>
                )}
              </div>
              <span className={`text-xs font-medium ${active ? "text-[#e8733b]" : done ? "text-[#2d6a4f]" : "text-[#aaa]"}`}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div className={`mb-6 h-px w-24 ${done ? "bg-[#2d6a4f]" : "bg-[#e8e4de]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elderlyUserId, setElderlyUserId] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");

  const [profile, setProfile] = useState<ProfileData>({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [elderly, setElderly] = useState<ElderlyData>({ name: "", age: "", phone: "", nickname: "", phoneModel: "" });
  const [agent, setAgent] = useState<AgentData>({ voice: "warm-female", speed: 1.0, metaphor: true });

  async function handleStep1() {
    setLoading(true); setError("");
    try {
      // Use admin API route to create user without triggering Supabase email sends
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, password: profile.password }),
      });
      const signupJson = await signupRes.json();
      if (!signupRes.ok) throw new Error(signupJson.error ?? "Signup failed");

      // Sign in to establish a session in the browser
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: profile.password,
      });
      if (signInError) throw signInError;

      const res = await fetch("/api/auth/caretaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: signupJson.id,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          email: profile.email,
          phone: profile.phone,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create profile");
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/dashboard/elderly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: elderly.name,
          phone: elderly.phone,
          age: elderly.age ? parseInt(elderly.age) : undefined,
          nickname: elderly.nickname || undefined,
          phone_model: elderly.phoneModel || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to link user");
      setElderlyUserId(json.elderly_user_id);
      setDemoCode(json.verification_code);
      setStep("2verify");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/dashboard/elderly/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elderly_user_id: elderlyUserId, code: enteredCode }),
      });
      const json = await res.json();
      if (!res.ok || !json.verified) throw new Error("Incorrect code. Try again.");
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3() {
    setLoading(true); setError("");
    try {
      const voiceId = agent.voice === "warm-female" ? "warm-female" : "calm-male";
      await fetch(`/api/dashboard/config/${elderlyUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elevenlabs_voice_id: voiceId,
          // We keep defaults for other fields
          tts_speed: 1.0,
          metaphor_mode: false,
        }),
      });
      window.location.href = "/dashboard";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <div className="flex justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8733b]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C5.79 2 4 3.79 4 6c0 1.48.81 2.77 2 3.46V8h4V7.46C11.19 5.77 12 4.48 12 3c0-2.21-1.79-4-4-4z" fill="white" opacity=".9"/>
            </svg>
          </div>
          <span className="font-semibold text-[#1a1208]">Coco</span>
        </div>
      </div>

      <div className="flex justify-center py-4">
        <StepIndicator current={step} />
      </div>

      <div className="mx-auto mt-6 max-w-2xl px-4 pb-16">
        <div className="rounded-2xl border border-[#e8e4de] bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Step 1: Your profile */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1208]">Create your account</h2>
                <p className="mt-1 text-sm text-[#888]">You'll use this to log into your Coco caretaker dashboard.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="First name" placeholder="Sarah" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
                <Input label="Last name" placeholder="Mitchell" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
              </div>
              <Input label="Email address" type="email" placeholder="sarah@gmail.com" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
              <PhoneInput label="Your mobile number" hint="Coco sends you urgent scam alerts here via SMS" value={profile.phone} onChange={v => setProfile(p => ({ ...p, phone: v }))} />
              <Input label="Password" type="password" placeholder="Create a strong password" value={profile.password} onChange={e => setProfile(p => ({ ...p, email: profile.email, password: e.target.value }))} />
              <div className="flex justify-end pt-2">
                <Button onClick={handleStep1} disabled={loading || !profile.firstName || !profile.email || !profile.password} size="lg">
                  {loading ? "Creating…" : "Continue →"}
                </Button>
              </div>
              <p className="text-center text-sm text-[#888]">
                Already have one?{" "}
                <a href="/auth/login" className="text-[#e8733b] hover:underline font-medium">Sign in</a>
              </p>
            </div>
          )}

          {/* Step 2: Link loved one */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1208]">Link your loved one</h2>
                <p className="mt-1 text-sm text-[#888]">Connect their phone so Coco knows who to look after.</p>
              </div>
              <div className="rounded-xl bg-[#fef3e0] border border-[#fde68a] px-4 py-3 text-sm text-[#d97706]">
                <strong>How linking works:</strong> We'll send a one-time SMS to their phone. They just need to reply <strong>"YES"</strong> to confirm the connection.
              </div>
              <Input label="Their first name" placeholder="Harold" value={elderly.name} onChange={e => setElderly(p => ({ ...p, name: e.target.value }))} />
              <Input label="Nickname (optional)" placeholder="Dad, Mom, Grandpa…" hint="Shows in your sidebar for quick reference" value={elderly.nickname} onChange={e => setElderly(p => ({ ...p, nickname: e.target.value }))} />
              <Input label="Their age (optional)" type="number" placeholder="78" hint="Helps Coco calibrate pacing and patience level" value={elderly.age} onChange={e => setElderly(p => ({ ...p, age: e.target.value }))} />
              <PhoneInput label="Their mobile number" hint="This is the number they'll call Coco from" value={elderly.phone} onChange={v => setElderly(p => ({ ...p, phone: v }))} />
              <PhoneModelSelect
                value={elderly.phoneModel}
                onChange={v => setElderly(p => ({ ...p, phoneModel: v }))}
                hint="Coco tailors button descriptions and gestures to their specific device"
              />
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                <Button onClick={handleStep2} disabled={loading || !elderly.name || !elderly.phone} size="lg">
                  {loading ? "Sending…" : "Send verification SMS →"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 verify: Demo code entry */}
          {step === "2verify" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1208]">Verify the connection</h2>
                <p className="mt-1 text-sm text-[#888]">In production, this code would be sent to {elderly.name}&apos;s phone. For this demo, use the code below.</p>
              </div>
              <div className="rounded-xl bg-[#fef3e0] border border-[#fde68a] px-5 py-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-[#d97706] mb-2">Demo verification code</p>
                <p className="text-4xl font-bold tracking-widest text-[#1a1208]">{demoCode}</p>
                <p className="text-xs text-[#d97706] mt-2">This code would normally be sent via SMS</p>
              </div>
              <Input
                label="Enter the code above"
                placeholder="______"
                value={enteredCode}
                onChange={e => setEnteredCode(e.target.value)}
              />
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
                <Button onClick={handleVerify} disabled={loading || enteredCode.length < 6} size="lg">
                  {loading ? "Verifying…" : "Verify →"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Set up agent */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1208]">Configure the agent</h2>
                <p className="mt-1 text-sm text-[#888]">Choose a voice for Coco. Coco changes speed dynamically based on the level of the user.</p>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-[#1a1208]">Choose Coco's voice for {elderly.name || "them"}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "warm-female" as const, name: "Warm Female", desc: "Gentle, motherly" },
                    { id: "calm-male" as const, name: "Calm Male", desc: "Steady, reassuring" },
                  ].map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setAgent(a => ({ ...a, voice: v.id }))}
                      className={`rounded-xl border-2 p-4 text-left transition ${agent.voice === v.id ? "border-[#e8733b] bg-[#fff8f4]" : "border-[#e8e4de] bg-white hover:bg-[#f5f4f0]"}`}
                    >
                      <p className="text-sm font-semibold text-[#1a1208]">{v.name}</p>
                      <p className="text-xs text-[#888]">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
                <Button onClick={handleStep3} disabled={loading} size="lg">
                  {loading ? "Launching…" : "Launch Coco 🎉"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
        </div>
      </div>
    </div>
  );
}
