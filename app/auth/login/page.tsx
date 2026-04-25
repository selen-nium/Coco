"use client";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left dark panel */}
      <div className="hidden w-[420px] shrink-0 flex-col justify-between bg-[#17120a] p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8733b]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3C6.79 3 5 4.79 5 7c0 1.48.81 2.77 2 3.46V12h4v-1.54C12.19 9.77 13 8.48 13 7c0-2.21-1.79-4-4-4z" fill="white" opacity=".9"/>
              <rect x="7" y="12" width="4" height="1.5" rx=".75" fill="white" opacity=".7"/>
              <rect x="7.5" y="14" width="3" height="1" rx=".5" fill="white" opacity=".5"/>
            </svg>
          </div>
          <span className="text-base font-semibold text-white">Coco</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-white">
            A patient voice<br />for the ones<br />you love.
          </h1>
          <p className="text-sm leading-relaxed text-[#a09080]">
            Coco guides elderly users step-by-step through their digital lives — so they stay independent, and you can rest easy.
          </p>
          <div className="space-y-4 pt-2">
            {[
              { icon: "📞", text: "Voice-first — no app needed for your loved one" },
              { icon: "🛡️", text: "Real-time scam detection & instant caretaker alerts" },
              { icon: "📊", text: "Mood & cognitive health tracking over time" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/8 text-sm">
                  {item.icon}
                </div>
                <span className="text-sm leading-relaxed text-[#a09080]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#5a4a3a]">© 2026 Coco AI · Privacy · Terms</p>
      </div>

      {/* Right light panel */}
      <div className="flex flex-1 items-center justify-center bg-[#f5f4f0] px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold text-[#1a1208]">Welcome back</h2>
          <p className="mt-2 text-sm text-[#888]">Sign in to your caretaker dashboard.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
