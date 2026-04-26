"use client";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left dark panel */}
      <div className="hidden w-[420px] shrink-0 flex-col justify-between bg-[#17120a] p-10 lg:flex">
        <div className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Coco" className="h-9 w-auto" />
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
      <div className="flex flex-1 items-center justify-center bg-[#f5f4f0] px-5 py-12 min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">
          {/* Mobile logo (shown when left panel is hidden) */}
          <div className="flex justify-center mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Coco" className="h-9 w-auto" />
          </div>
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
