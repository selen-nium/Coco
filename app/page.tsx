"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const IconMic = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" fill="white" opacity=".5" stroke="white" strokeWidth="1.4"/>
    <path d="M2.5 9a5.5 5.5 0 0 0 11 0M8 14.5V12" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconPhone = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M5.5 3h4.2l2.1 4.8L9 9.55c.98 2.1 2.1 3.3 4.2 4.2l2.25-2.55L20.5 13.9V18a1.5 1.5 0 0 1-1.5 1.5C9.3 19.5 4 14.2 4 5a1.5 1.5 0 0 1 1.5-2Z" stroke="#e07438" strokeWidth="1.6" fill="none"/>
  </svg>
);
const IconShield = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 6v7c0 5.25 4.2 8.55 9 9.75C16.8 21.55 21 18.25 21 13V6L12 2Z" stroke="#3d8c6a" strokeWidth="1.5" fill="none"/>
    <path d="M8 12.5l3 3 6-6" stroke="#3d8c6a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconDashboard = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="4" stroke="#4A7FC1" strokeWidth="1.5" fill="none"/>
    <path d="M7 12h10M7 8h6M7 16h8" stroke="#4A7FC1" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconArrowRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevLeft = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevRight = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCallFill = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M5.5 3h4.2l2.1 4.8L9 9.55c.98 2.1 2.1 3.3 4.2 4.2l2.25-2.55L20.5 13.9V18a1.5 1.5 0 0 1-1.5 1.5C9.3 19.5 4 14.2 4 5a1.5 1.5 0 0 1 1.5-2Z" fill="white"/>
  </svg>
);

// ── Wave animation bars ───────────────────────────────────────────────────────
const WaveBars = ({ delays }: { delays: number[] }) => (
  <div className="flex items-center gap-1 h-10">
    {delays.map((d, i) => (
      <span
        key={i}
        className="block w-[3px] min-w-[3px] bg-[#e07438] rounded-[2px]"
        style={{ height: 6, animation: "lp-wave-bar 1.4s ease-in-out infinite", animationDelay: `${d}s` }}
      />
    ))}
  </div>
);

// ── Phone frame for How It Works scenes ──────────────────────────────────────
const HowPhone = ({ children }: { children: React.ReactNode }) => (
  <div
    className="relative flex flex-col items-center justify-start overflow-hidden gap-3 rounded-[28px] border border-[#ecdecb]"
    style={{
      width: 180, height: 320,
      background: "linear-gradient(160deg,#fffcf7,#fdf3e3)",
      padding: "40px 18px 18px",
      boxShadow: "0 20px 60px rgba(28,19,9,.1)",
    }}
  >
    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[50px] h-[5px] bg-[#ecdecb] rounded-full" />
    {children}
  </div>
);

const SceneLabel = ({ label, caption }: { label: string; caption: string }) => (
  <>
    <div className="text-[13px] font-semibold text-[#9e8e7a] tracking-[.06em] uppercase">{label}</div>
    <div className="text-base text-[#6b5e4a] leading-[1.6] max-w-[360px] text-center">{caption}</div>
  </>
);

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURE_CARDS = [
  {
    num: "01 / 03", iconBg: "rgba(224,116,56,.12)", icon: <IconPhone />,
    title: "Just dial a number.",
    text: "No app to install. No screen to navigate. Your loved one calls a dedicated phone number and Coco answers — immediately, patiently, in plain English. Voice-first by design, because that's what works.",
    tagBg: "#fff3cc", tagColor: "#a06a00", tag: "No smartphone skills required",
  },
  {
    num: "02 / 03", iconBg: "rgba(61,140,106,.1)", icon: <IconShield />,
    title: "Scam Shield.",
    text: "Gemini 1.5 Flash monitors every call in real-time. The moment it detects high-pressure language — IRS threats, gift cards, wire transfer requests — it ends the call and texts you immediately.",
    tagBg: "rgba(61,140,106,.09)", tagColor: "#2d6e52", tag: "Powered by Gemini",
  },
  {
    num: "03 / 03", iconBg: "rgba(74,127,193,.1)", icon: <IconDashboard />,
    title: "Caretaker dashboard.",
    text: "See every call, AI-generated summaries, and live alerts — all in a web dashboard built for you. Configure Coco's voice, pacing, and personality. Stay informed without being in the room.",
    tagBg: "rgba(74,127,193,.1)", tagColor: "#2f5e9e", tag: "Full visibility & control",
  },
];

const STEPS = [
  { title: "Harold dials in",   text: "He calls his dedicated Coco number from any phone. No app, no internet, no setup needed." },
  { title: "Coco listens",      text: "He describes his problem in plain English. Coco classifies the intent and loads the right guide instantly." },
  { title: "Step by step",      text: "Coco talks Harold through every action, confirming each step. Adapts if he gets confused or goes off-track." },
  { title: "You stay informed", text: "Sarah sees an AI summary of the call, any alerts triggered, and Harold's mood trend — all in the dashboard." },
];

const PROBLEMS = [
  {
    icon: "📞",
    title: "Tech support is too complex",
    text: "Existing solutions assume smartphone literacy. Hold menus, multi-step apps, and jargon leave seniors stranded.",
  },
  {
    icon: "🎣",
    title: "Scams are targeting the vulnerable",
    text: "1 in 5 seniors fall victim to phone scams each year. Families have no way to intervene in real time.",
  },
  {
    icon: "😔",
    title: "Caretakers are kept in the dark",
    text: "Families worry constantly but can't monitor every interaction. There's no visibility, no alerts, no peace of mind.",
  },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeCard, setActiveCard] = useState(0);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIdxRef   = useRef(0);

  // Scroll: progress bar + nav blur
  useEffect(() => {
    const onScroll = () => {
      const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      const prog = document.getElementById("lp-progress");
      if (prog) prog.style.width = pct + "%";

      const nav = document.getElementById("lp-nav");
      if (!nav) return;
      if (window.scrollY > 40) {
        nav.style.background     = "rgba(253,249,244,.9)";
        nav.style.backdropFilter = "blur(16px)";
        nav.style.borderBottom   = "1px solid #f3ebe0";
      } else {
        nav.style.background     = "transparent";
        nav.style.backdropFilter = "none";
        nav.style.borderBottom   = "none";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll reveals
  useEffect(() => {
    const els = document.querySelectorAll(".lp-reveal,.lp-reveal-l,.lp-reveal-r,.lp-reveal-s");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const delay = parseFloat(el.style.transitionDelay || "0") * 1000;
        setTimeout(() => el.classList.add("in"), delay);
        obs.unobserve(el);
      });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // How section auto-advance
  useEffect(() => {
    const section = document.getElementById("how");
    if (!section) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (stepTimerRef.current) clearInterval(stepTimerRef.current);
        stepTimerRef.current = setInterval(() => {
          stepIdxRef.current = (stepIdxRef.current + 1) % 4;
          setActiveStep(stepIdxRef.current);
        }, 3000);
      } else {
        if (stepTimerRef.current) { clearInterval(stepTimerRef.current); stepTimerRef.current = null; }
      }
    }, { threshold: 0.3 });
    obs.observe(section);
    return () => { obs.disconnect(); if (stepTimerRef.current) clearInterval(stepTimerRef.current); };
  }, []);

  const handleStepClick = (idx: number) => {
    if (stepTimerRef.current) { clearInterval(stepTimerRef.current); stepTimerRef.current = null; }
    stepIdxRef.current = idx;
    setActiveStep(idx);
  };

  // Circular carousel: left, center, right indices
  const leftIdx   = (activeCard + 2) % 3;
  const rightIdx  = (activeCard + 1) % 3;

  return (
    <div className="bg-[#fdf9f4] text-[#1c1309] overflow-x-hidden font-[var(--font-dm-sans,DM_Sans,sans-serif)]">

      {/* ── Progress bar ── */}
      <div
        id="lp-progress"
        className="fixed top-0 left-0 h-[2px] bg-[#f5a800] z-[1000] transition-[width] duration-100 ease-linear"
        style={{ width: "0%" }}
      />

      {/* ── Nav ── */}
      <nav
        id="lp-nav"
        className="fixed top-0 left-0 right-0 z-[999] flex items-center justify-between px-[60px] py-[18px] transition-all duration-300"
      >
        <a href="#" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 bg-[#e07438] rounded-lg flex items-center justify-center shrink-0">
            <IconMic />
          </div>
          <span className="text-lg font-bold text-[#1c1309] tracking-[-0.3px]">Coco</span>
        </a>

        <div className="flex items-center gap-8">
          {(["#problem", "#solution", "#how"] as const).map((href, i) => (
            <a key={href} href={href} className="lp-nav-link text-sm text-[#6b5e4a] no-underline">
              {["The Problem", "Features", "How it works"][i]}
            </a>
          ))}
        </div>

        <Link
          href="/auth/signup"
          className="lp-nav-cta bg-[#1c1309] text-[#fdf9f4] py-[9px] px-[22px] rounded-[10px] text-sm font-semibold no-underline"
        >
          Get started →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-[#fdf9f4] px-[60px] pt-[140px] pb-[80px]"
      >
        {/* ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "40%", left: "50%", transform: "translate(-50%,-50%)",
            width: 900, height: 600,
            background: "radial-gradient(ellipse,rgba(245,168,0,.10) 0%,transparent 70%)",
          }}
        />
        {/* dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle,rgba(180,140,80,.18) 1px,transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%,black,transparent)",
          }}
        />

        {/* eyebrow */}
        <div className="lp-anim-eyebrow inline-flex items-center gap-2 bg-[#fff3cc] border border-[rgba(245,168,0,.35)] rounded-[20px] py-[6px] px-4 text-[12.5px] font-semibold text-[#a06a00] tracking-[.05em] uppercase mb-7">
          <span
            className="w-[6px] h-[6px] bg-[#e07438] rounded-full shrink-0"
            style={{ animation: "lp-pulse 2s infinite" }}
          />
          A new kind of tech support
        </div>

        {/* headline */}
        <h1
          className="lp-anim-title font-bold leading-none mb-6 text-[#1c1309] tracking-[-3px]"
          style={{ fontSize: "clamp(64px,9vw,116px)" }}
        >
          Meet <span className="text-[#e07438]">Coco.</span>
        </h1>

        {/* subtitle */}
        <p
          className="lp-anim-sub text-[#6b5e4a] max-w-[520px] leading-[1.7] mx-auto font-normal"
          style={{ fontSize: "clamp(16px,1.6vw,20px)" }}
        >
          A <strong className="text-[#1c1309] font-semibold">voice AI</strong> your elderly loved one can call any time — patient, warm, jargon-free — so families can finally rest easy.
        </p>

        {/* CTA buttons */}
        <div className="lp-anim-actions flex items-center gap-3.5 justify-center mt-11">
          <Link
            href="/auth/signup"
            className="lp-btn-primary bg-[#1c1309] text-[#fdf9f4] py-[14px] px-8 rounded-xl text-[15px] font-bold no-underline inline-flex items-center gap-2"
          >
            Get early access <IconArrowRight />
          </Link>
          <a
            href="#problem"
            className="lp-btn-ghost text-[#6b5e4a] py-[14px] px-6 rounded-xl text-[15px] font-medium no-underline inline-flex items-center gap-2 border border-[#ecdecb]"
          >
            See the problem →
          </a>
        </div>

        {/* Phone mockup */}
        <div className="lp-anim-phone mt-[72px] relative inline-block">
          <div
            className="relative overflow-hidden rounded-[36px] border border-[#ecdecb]"
            style={{
              width: 260, height: 480,
              background: "linear-gradient(160deg,#fffcf7,#fdf3e3)",
              boxShadow: "0 40px 80px rgba(28,19,9,.12),0 0 0 1px rgba(245,168,0,.08)",
            }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[70px] h-[6px] bg-[#ecdecb] rounded-full" />
            <div className="absolute inset-3 bg-[#faf5ec] rounded-[26px] flex flex-col items-center justify-center gap-3.5 p-5">
              <div className="flex items-center gap-1.5 bg-[#fff3cc] border border-[rgba(245,168,0,.3)] rounded-[20px] py-[5px] px-3">
                <div
                  className="w-[6px] h-[6px] bg-[#e07438] rounded-full"
                  style={{ animation: "lp-pulse 1.5s infinite" }}
                />
                <span className="text-[11px] text-[#a06a00] font-semibold">Call in progress</span>
              </div>
              <WaveBars delays={[0, .1, .2, .3, .2, .1, 0]} />
              <div className="text-[11px] text-[#9e8e7a] tracking-[.06em] uppercase">Coco is speaking</div>
            </div>
          </div>

          {/* floating badge 1 */}
          <div
            className="absolute bg-white border border-[#ecdecb] rounded-xl px-3.5 py-2.5 whitespace-nowrap"
            style={{ right: -80, top: 60, boxShadow: "0 4px 20px rgba(28,19,9,.08)", animation: "lp-float-badge 4s ease-in-out infinite" }}
          >
            <div className="text-[10.5px] text-[#9e8e7a] mb-0.5">Scam Shield</div>
            <div className="text-[13px] font-semibold text-[#1c1309]">🛡 Active</div>
          </div>

          {/* floating badge 2 */}
          <div
            className="absolute bg-white border border-[#ecdecb] rounded-xl px-3.5 py-2.5 whitespace-nowrap"
            style={{ left: -100, bottom: 80, boxShadow: "0 4px 20px rgba(28,19,9,.08)", animation: "lp-float-badge 4s ease-in-out infinite", animationDelay: "-2s" }}
          >
            <div className="text-[10.5px] text-[#9e8e7a] mb-0.5">Caretaker notified</div>
            <div className="text-[13px] font-semibold text-[#1c1309]">SMS sent to Sarah</div>
          </div>
        </div>

        {/* ── Scroll hint — fixed: spans full width so items-center truly centers ── */}
        <div
          className="absolute bottom-9 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none"
          style={{ animation: "lp-fade-in-up 1s 2.5s both" }}
        >
          <span className="text-[11px] text-[#9e8e7a] tracking-[.1em] uppercase">Scroll to explore</span>
          <div
            className="w-5 h-5 border-r-[1.5px] border-b-[1.5px] border-[#9e8e7a]"
            style={{ animation: "lp-bounce-down 1.5s ease infinite" }}
          />
        </div>
      </section>

      {/* ── Problem ── */}
      <section id="problem" className="bg-[#fff8ee] px-[60px] py-[120px]">
        <div className="max-w-[1100px] mx-auto">
          {/* header */}
          <div className="max-w-[560px] mb-16">
            <div className="lp-reveal-l text-[11.5px] font-bold tracking-[.12em] uppercase text-[#e07438] mb-3.5">
              The Problem
            </div>
            <h2
              className="lp-reveal-l font-bold leading-[1.08] text-[#1c1309] tracking-[-1.5px] mb-5"
              style={{ fontSize: "clamp(36px,5vw,56px)" }}
            >
              Our parents deserve better<br />than being left behind.
            </h2>
            <p className="lp-reveal-l text-[17px] text-[#6b5e4a] leading-[1.7]">
              Technology moves fast. The people who raised us can't always keep up. And the systems meant to help them often make things worse.
            </p>
          </div>

          {/* problem cards */}
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {PROBLEMS.map((p, i) => (
              <div
                key={i}
                className="lp-reveal-s bg-white rounded-2xl p-8 border border-[#ecdecb]"
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div className="text-4xl mb-5">{p.icon}</div>
                <h3 className="text-[17px] font-bold text-[#1c1309] mb-3 tracking-[-0.3px]">{p.title}</h3>
                <p className="text-[15px] text-[#6b5e4a] leading-[1.7]">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution / Features Carousel ── */}
      <section id="solution" className="bg-[#1c1309] overflow-hidden py-[120px]">
        {/* header */}
        <div className="text-center max-w-[640px] mx-auto mb-16 px-[60px]">
          <div className="lp-reveal text-[11.5px] font-bold tracking-[.12em] uppercase text-[#e07438] mb-3.5">
            Our solution
          </div>
          <h2
            className="lp-reveal font-bold leading-[1.08] text-white tracking-[-1.5px]"
            style={{ fontSize: "clamp(36px,5vw,56px)" }}
          >
            Everything seniors need.<br />Everything caretakers want.
          </h2>
          <p className="lp-reveal text-[17px] text-[#9e8e7a] leading-[1.7] max-w-[560px] mx-auto mt-4">
            Coco is a voice AI your loved one can call any time — guided, protected, and monitored by you.
          </p>
        </div>

        {/* Centered card carousel */}
        <div className="relative overflow-hidden" style={{ height: 480 }}>
          {/* Left card */}
          <div
            className="absolute top-1/2 transition-all duration-500 cursor-pointer"
            style={{
              width: 380,
              left: "50%",
              transform: "translate(calc(-50% - 420px), -50%) scale(0.87)",
              opacity: 0.5,
              zIndex: 5,
            }}
            onClick={() => setActiveCard(leftIdx)}
          >
            <FeatureCardInner card={FEATURE_CARDS[leftIdx]} isActive={false} />
          </div>

          {/* Center card */}
          <div
            className="absolute top-1/2 transition-all duration-500"
            style={{
              width: 380,
              left: "50%",
              transform: "translate(-50%, -50%) scale(1)",
              opacity: 1,
              zIndex: 10,
            }}
          >
            <FeatureCardInner card={FEATURE_CARDS[activeCard]} isActive={true} />
          </div>

          {/* Right card */}
          <div
            className="absolute top-1/2 transition-all duration-500 cursor-pointer"
            style={{
              width: 380,
              left: "50%",
              transform: "translate(calc(-50% + 420px), -50%) scale(0.87)",
              opacity: 0.5,
              zIndex: 5,
            }}
            onClick={() => setActiveCard(rightIdx)}
          >
            <FeatureCardInner card={FEATURE_CARDS[rightIdx]} isActive={false} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => setActiveCard(leftIdx)}
            className="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <IconChevLeft />
          </button>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              onClick={() => setActiveCard(i)}
              className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                activeCard === i ? "w-6 bg-[#e07438]" : "w-2 bg-white/30"
              }`}
            />
          ))}
          <button
            onClick={() => setActiveCard(rightIdx)}
            className="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <IconChevRight />
          </button>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="bg-white px-[60px] py-[120px]">
        <div className="text-center max-w-[560px] mx-auto mb-20">
          <div className="lp-reveal text-[11.5px] font-bold tracking-[.12em] uppercase text-[#e07438] mb-3.5">
            How it works
          </div>
          <h2
            className="lp-reveal font-bold leading-[1.08] text-[#1c1309] tracking-[-1.5px]"
            style={{ fontSize: "clamp(36px,5vw,56px)" }}
          >
            Simple as a phone call.
          </h2>
        </div>

        {/* Two-column layout — inline gridTemplateColumns to guarantee parsing */}
        <div
          className="grid gap-[60px] max-w-[1100px] mx-auto items-start"
          style={{ gridTemplateColumns: "360px 1fr" }}
        >
          {/* Left: steps list */}
          <div className="flex flex-col relative">
            {STEPS.map((step, i) => (
              <div
                key={i}
                onClick={() => handleStepClick(i)}
                className={`flex gap-5 px-5 py-6 rounded-2xl cursor-pointer relative transition-colors duration-200 ${
                  activeStep === i ? "bg-[#fff8ee]" : "bg-transparent"
                }`}
              >
                {i < 3 && (
                  <div className="absolute left-[39px] top-[72px] bottom-[-24px] w-[1.5px] bg-[#ecdecb] z-0" />
                )}
                <div
                  className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 relative z-[1] transition-all duration-300 ${
                    activeStep === i
                      ? "bg-[#e07438] text-white shadow-[0_4px_12px_rgba(224,116,56,.3)]"
                      : "bg-[#ecdecb] text-[#9e8e7a]"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="pt-0.5">
                  <div
                    className={`text-[15px] font-bold mb-1 transition-colors duration-200 ${
                      activeStep === i ? "text-[#1c1309]" : "text-[#6b5e4a]"
                    }`}
                  >
                    {step.title}
                  </div>
                  {activeStep === i && (
                    <div className="text-[13.5px] text-[#9e8e7a] leading-[1.6]">{step.text}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: visual panel */}
          <div className="sticky top-[120px] rounded-3xl overflow-hidden border border-[#ecdecb] bg-[#fdf9f4] min-h-[460px] flex items-center justify-center">

            {activeStep === 0 && (
              <div className="flex flex-col items-center w-full text-center px-10 py-10 gap-7">
                <HowPhone>
                  <div className="text-[11px] text-[#9e8e7a] tracking-[.06em] uppercase mb-0.5">Coco</div>
                  <div className="text-xl font-bold text-[#1c1309] tracking-[1px] mb-2.5 text-center">+1 855 626 2624</div>
                  <div className="grid grid-cols-3 gap-2">
                    {["1","2","3","4","5","6","7","8","9","","0",""].map((k, j) => (
                      <div
                        key={j}
                        className="w-10 h-10 rounded-full bg-[#fff8ee] border border-[#ecdecb] flex items-center justify-center text-sm font-semibold text-[#1c1309]"
                        style={{ visibility: k === "" ? "hidden" : "visible" }}
                      >
                        {k}
                      </div>
                    ))}
                  </div>
                  <div
                    className="w-12 h-12 rounded-full bg-[#3d8c6a] flex items-center justify-center mt-1.5"
                    style={{ animation: "lp-call-pulse 2s ease-in-out infinite" }}
                  >
                    <IconCallFill />
                  </div>
                </HowPhone>
                <SceneLabel label="Any phone works" caption="Harold calls from the same number he always has. No setup, no downloads." />
              </div>
            )}

            {activeStep === 1 && (
              <div className="flex flex-col items-center w-full text-center px-10 py-10 gap-7">
                <HowPhone>
                  <div className="flex items-center gap-1.5 bg-[#fff3cc] border border-[rgba(245,168,0,.3)] rounded-[20px] py-[5px] px-2.5 text-[11px] font-semibold text-[#a06a00] self-start">
                    <div className="w-[6px] h-[6px] bg-[#e07438] rounded-full" style={{ animation: "lp-pulse 1.5s infinite" }} />
                    Call in progress
                  </div>
                  <div className="flex items-center gap-[5px] h-12">
                    {[0, .15, .3, .15, 0].map((d, i) => (
                      <span key={i} className="block w-1 h-[6px] bg-[#e07438] rounded-[2px]" style={{ animation: "lp-wave-bar 1.4s ease-in-out infinite", animationDelay: `${d}s` }} />
                    ))}
                  </div>
                  <div className="bg-[#fff3cc] border border-[rgba(245,168,0,.3)] rounded-[12px_12px_12px_2px] px-3.5 py-2.5 text-xs text-[#7a5000] max-w-[140px] text-left leading-[1.5]">
                    "I can't figure out how to send this photo to my daughter…"
                  </div>
                  <div className="bg-[rgba(61,140,106,.08)] border border-[rgba(61,140,106,.2)] rounded-[12px_12px_2px_12px] px-3.5 py-2.5 text-xs text-[#2d6e52] max-w-[140px] text-left leading-[1.5]">
                    Got it! I can help with that. What phone do you have?
                  </div>
                </HowPhone>
                <SceneLabel label="Plain English, always" caption="Coco hears the problem and loads the right guide — no menus, no forms to fill out." />
              </div>
            )}

            {activeStep === 2 && (
              <div className="flex flex-col items-center w-full text-center px-10 py-10 gap-7">
                <HowPhone>
                  <div className="text-[10px] font-bold uppercase tracking-[.08em] text-[#9e8e7a] mb-1 w-full">Sending a photo</div>
                  <div className="flex flex-col gap-2 w-full">
                    {[
                      { label: "Open your Photos app", state: "done" },
                      { label: "Find the photo",        state: "done" },
                      { label: "Tap the Share button",  state: "current" },
                      { label: "Choose Messages",       state: "pending" },
                      { label: "Type daughter's name",  state: "pending" },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2.5 rounded-[10px] px-3 py-[9px] text-xs text-[#6b5e4a] border ${
                          row.state === "done"    ? "bg-[rgba(61,140,106,.07)] border-[rgba(61,140,106,.2)]" :
                          row.state === "current" ? "bg-[#fff3cc] border-[rgba(245,168,0,.3)]" :
                                                    "bg-[#fdf9f4] border-[#ecdecb]"
                        }`}
                      >
                        <div
                          className="w-[6px] h-[6px] rounded-full shrink-0"
                          style={{
                            background: row.state === "done" ? "#3d8c6a" : row.state === "current" ? "#e07438" : "#ecdecb",
                            animation: row.state === "current" ? "lp-pulse 1.2s infinite" : undefined,
                          }}
                        />
                        {row.label}
                        {row.state === "done" && <span className="text-[#3d8c6a] text-xs ml-auto">✓</span>}
                      </div>
                    ))}
                  </div>
                </HowPhone>
                <SceneLabel label="One step at a time" caption="Coco confirms each action before moving on. Never overwhelming, always patient." />
              </div>
            )}

            {activeStep === 3 && (
              <div className="flex flex-col items-center w-full text-center px-10 py-10 gap-7">
                <div className="flex flex-col gap-3 w-full max-w-[320px]">
                  <div className="text-[11px] font-bold uppercase tracking-[.08em] text-[#9e8e7a] mb-1">Harold's latest call</div>
                  <div className="bg-white border border-[#ecdecb] rounded-xl px-4 py-3.5 text-left">
                    <div className="text-[10px] font-bold uppercase tracking-[.08em] text-[#9e8e7a] mb-1.5">AI Summary</div>
                    <div className="text-[13px] text-[#6b5e4a] leading-[1.55]">Harold needed help sending a photo via Messages. Resolved in 4 minutes. No scam activity detected.</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: "Duration", val: "4m 22s",   sub: "Resolved ✓",   subColor: "text-[#3d8c6a]" },
                      { label: "Mood",     val: "😊 Happy", sub: "+2 this week", subColor: "text-[#3d8c6a]" },
                    ].map((item, i) => (
                      <div key={i} className="bg-white border border-[#ecdecb] rounded-xl px-4 py-3.5 text-left">
                        <div className="text-[10px] font-bold uppercase tracking-[.08em] text-[#9e8e7a] mb-1.5">{item.label}</div>
                        <div className="text-[15px] font-bold text-[#1c1309]">{item.val}</div>
                        <div className={`text-xs mt-0.5 ${item.subColor}`}>{item.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white border border-[#ecdecb] rounded-xl px-4 py-3.5 text-left">
                    <div className="text-[10px] font-bold uppercase tracking-[.08em] text-[#9e8e7a] mb-1.5">Alerts</div>
                    <div className="text-[13px] text-[#9e8e7a]">None triggered</div>
                  </div>
                </div>
                <SceneLabel label="Full visibility" caption="Sarah sees every call, at a glance — without being on the phone herself." />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta" className="bg-[#fff8ee] text-center px-[60px] py-[140px]">
        <div className="max-w-[640px] mx-auto">
          <div className="lp-reveal flex justify-center text-[11.5px] font-bold tracking-[.12em] uppercase text-[#e07438] mb-3.5">
            Get started
          </div>
          <h2
            className="lp-reveal font-bold leading-[1.05] text-[#1c1309] mb-[18px] tracking-[-2px]"
            style={{ fontSize: "clamp(40px,6vw,68px)" }}
          >
            Give Harold the help<br />he deserves.<br /><span className="text-[#e07438]">On his terms.</span>
          </h2>
          <p className="lp-reveal text-lg text-[#6b5e4a] max-w-[440px] mx-auto mb-11 leading-[1.65]">
            Set up takes 5 minutes. Your loved one never has to touch a screen.
          </p>
          <div className="lp-reveal">
            <Link
              href="/auth/signup"
              className="lp-btn-cta bg-[#e07438] text-white py-[18px] px-11 rounded-[14px] text-[17px] font-bold no-underline inline-flex items-center gap-2.5"
              style={{ boxShadow: "0 8px 30px rgba(224,116,56,.3)" }}
            >
              Create a free account
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#fdf9f4] border-t border-[#f3ebe0] px-[60px] py-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#e07438] rounded-[7px] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" fill="white" opacity=".5" stroke="white" strokeWidth="1.4" />
              <path d="M2.5 9a5.5 5.5 0 0 0 11 0M8 14.5V12" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-base font-bold text-[#1c1309]">Coco</span>
        </div>

        <div className="flex gap-7">
          {(["#problem", "#solution", "#how"] as const).map((href, i) => (
            <a key={href} href={href} className="lp-footer-link text-[13px] text-[#9e8e7a] no-underline">
              {["Problem", "Features", "How it works"][i]}
            </a>
          ))}
        </div>

        <div className="text-xs text-[#9e8e7a]">© 2026 Coco AI · Built with ♥ for the ones we love</div>
      </footer>

    </div>
  );
}

// ── Feature card inner (extracted to keep carousel JSX clean) ─────────────────
function FeatureCardInner({ card, isActive }: { card: typeof FEATURE_CARDS[number]; isActive: boolean }) {
  return (
    <div
      className={`bg-white rounded-3xl px-9 py-10 relative overflow-hidden border transition-all ${
        isActive ? "border-[rgba(245,168,0,.4)] shadow-[0_24px_60px_rgba(28,19,9,.18)]" : "border-[#ecdecb]"
      }`}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(140deg,rgba(245,168,0,.04),transparent 60%)" }}
      />
      <div className="text-[11px] font-bold tracking-[.12em] uppercase text-[#9e8e7a] mb-7">{card.num}</div>
      <div
        className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-[22px]"
        style={{ background: card.iconBg }}
      >
        {card.icon}
      </div>
      <div className="text-[22px] font-bold text-[#1c1309] mb-3 tracking-[-0.4px]">{card.title}</div>
      <div className="text-[15px] text-[#6b5e4a] leading-[1.72]">{card.text}</div>
      <div
        className="inline-flex items-center gap-[5px] rounded-[20px] py-[5px] px-3 text-[11.5px] font-bold mt-5 tracking-[.03em]"
        style={{ background: card.tagBg, color: card.tagColor }}
      >
        {card.tag}
      </div>
    </div>
  );
}
