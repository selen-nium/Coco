import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f4f0]">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8733b]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3C6.79 3 5 4.79 5 7c0 1.48.81 2.77 2 3.46V12h4v-1.54C12.19 9.77 13 8.48 13 7c0-2.21-1.79-4-4-4z" fill="white" opacity=".9"/>
              <rect x="7" y="12" width="4" height="1.5" rx=".75" fill="white" opacity=".7"/>
              <rect x="7.5" y="14" width="3" height="1" rx=".5" fill="white" opacity=".5"/>
            </svg>
          </div>
          <span className="text-base font-semibold text-[#1a1208]">Coco</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm font-medium text-[#888] hover:text-[#1a1208] transition-colors">
            Sign in
          </Link>
          <Link href="/auth/signup" className="rounded-xl bg-[#e8733b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d4622a] transition-colors">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e8e4de] bg-white px-4 py-1.5 text-xs font-medium text-[#888]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e8733b]" />
          Voice-first AI for elderly independence
        </div>
        <h1 className="max-w-2xl text-5xl font-bold leading-tight text-[#1a1208]">
          A patient voice for<br />the ones you love.
        </h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-[#888]">
          Coco guides elderly users step-by-step through their digital lives — so they stay independent, and you can rest easy.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link href="/auth/signup" className="rounded-xl bg-[#1a1208] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2d2010] transition-colors">
            Create caretaker account
          </Link>
          <Link href="/auth/login" className="rounded-xl border border-[#e8e4de] bg-white px-6 py-3 text-sm font-semibold text-[#1a1208] hover:border-[#d0cdc8] transition-colors">
            Sign in
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {[
            { icon: "📞", text: "No app needed for your loved one" },
            { icon: "🛡️", text: "Real-time scam detection" },
            { icon: "📊", text: "Mood & cognitive health tracking" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 rounded-full border border-[#e8e4de] bg-white px-4 py-2 text-sm text-[#888]">
              <span>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </main>

      <footer className="px-8 py-5 text-center text-xs text-[#bbb]">
        © 2026 Coco AI · Privacy · Terms
      </footer>
    </div>
  );
}
