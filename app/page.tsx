"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ── Icons ─────────────────────────────────────────────────────────────────────
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
const IconWave = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M9 18V6M6 15V9M12 20V4M15 18V6M18 15V9" stroke="#4A7FC1" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconAlertTriangle = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M12 2.5L2.5 21h19L12 2.5Z" stroke="#c0392b" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <path d="M12 9v5M12 16.5v.5" stroke="#c0392b" strokeWidth="1.6" strokeLinecap="round"/>
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

// ── Wave bars ─────────────────────────────────────────────────────────────────
const WaveBars = ({ delays }: { delays: number[] }) => (
  <div className="flex items-center gap-1 h-10">
    {delays.map((d, i) => (
      <span key={i} className="block w-[3px] min-w-[3px] bg-[#e07438] rounded-[2px]" style={{ height: 6, animation: "lp-wave-bar 1.4s ease-in-out infinite", animationDelay: `${d}s` }} />
    ))}
  </div>
);

// ── Inline toggle ─────────────────────────────────────────────────────────────
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#e07438]" : "bg-[#ddd]"}`}>
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
  </button>
);

// ── Architecture flowchart ────────────────────────────────────────────────────
function ArchDiagram() {
  const ac = "#999"; // arrow color
  const td = "#1a0800"; // text dark
  const C = { elderly: "#f5de7a", twilio: "#f28b82", eleven: "#7cb8e8", intent: "#c9a8e0", scam: "#f5a55a", diamond: "#f48fb1", green: "#81c995" };
  const fs = { fontSize: 11, fontWeight: "600" as const };
  const fss = { fontSize: 10.5, fontWeight: "600" as const };

  return (
    <div className="bg-white rounded-2xl border border-[#ecdecb] overflow-x-auto" style={{ boxShadow: "0 4px 24px rgba(28,19,9,.05)" }}>
      <svg viewBox="0 0 1685 270" width="100%" style={{ minWidth: 860, display: "block" }}>
        <defs>
          <marker id="arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <path d="M0 0 L7 2.5 L0 5 Z" fill={ac} />
          </marker>
        </defs>

        {/* 1. Elderly User */}
        <rect x={10} y={115} width={110} height={50} rx={7} fill={C.elderly} />
        <text x={65} y={137} textAnchor="middle" fill={td} {...fs}>Elderly</text>
        <text x={65} y={152} textAnchor="middle" fill={td} {...fs}>User</text>
        <line x1={120} y1={140} x2={170} y2={140} stroke={ac} strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* 2. Twilio Phone Call Layer */}
        <rect x={175} y={108} width={132} height={64} rx={7} fill={C.twilio} />
        <text x={241} y={129} textAnchor="middle" fill={td} {...fs}>Twilio</text>
        <text x={241} y={143} textAnchor="middle" fill={td} {...fs}>Phone Call</text>
        <text x={241} y={157} textAnchor="middle" fill={td} {...fs}>Layer</text>
        <line x1={307} y1={140} x2={356} y2={140} stroke={ac} strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* 3. ElevenLabs Voice Agent */}
        <rect x={361} y={113} width={135} height={54} rx={7} fill={C.eleven} />
        <text x={428} y={135} textAnchor="middle" fill={td} {...fs}>ElevenLabs</text>
        <text x={428} y={150} textAnchor="middle" fill={td} {...fs}>Voice Agent</text>

        {/* Fork from ElevenLabs */}
        <line x1={496} y1={140} x2={513} y2={140} stroke={ac} strokeWidth={1.5} />
        <line x1={513} y1={82} x2={513} y2={198} stroke={ac} strokeWidth={1.5} />
        <line x1={513} y1={82} x2={543} y2={82} stroke={ac} strokeWidth={1.5} markerEnd="url(#arr)" />
        <line x1={513} y1={198} x2={543} y2={198} stroke={ac} strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* 4. Intent Understanding (top) */}
        <rect x={548} y={62} width={130} height={40} rx={7} fill={C.intent} />
        <text x={613} y={79} textAnchor="middle" fill={td} {...fss}>Intent</text>
        <text x={613} y={93} textAnchor="middle" fill={td} {...fss}>Understanding</text>
        <line x1={678} y1={82} x2={710} y2={82} stroke={ac} strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* 5. Backend Semantic Search (top) */}
        <rect x={715} y={62} width={140} height={40} rx={7} fill={C.intent} />
        <text x={785} y={79} textAnchor="middle" fill={td} {...fss}>Backend Semantic</text>
        <text x={785} y={93} textAnchor="middle" fill={td} {...fss}>Search</text>
        <line x1={855} y1={82} x2={868} y2={82} stroke={ac} strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* 6. Scam / Risk Monitoring (bottom) */}
        <rect x={548} y={178} width={130} height={40} rx={7} fill={C.scam} />
        <text x={613} y={195} textAnchor="middle" fill={td} {...fss}>Scam / Risk</text>
        <text x={613} y={209} textAnchor="middle" fill={td} {...fss}>Monitoring</text>
        <line x1={678} y1={198} x2={710} y2={198} stroke={ac} strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* 7. Live Caretaker Dashboard Alert (bottom) */}
        <rect x={715} y={175} width={145} height={46} rx={7} fill={C.scam} />
        <text x={787} y={192} textAnchor="middle" fill={td} {...fss}>Live Caretaker</text>
        <text x={787} y={207} textAnchor="middle" fill={td} {...fss}>Dashboard Alert</text>

        {/* 8. Known Task Found? diamond — cx=913, cy=82 */}
        <polygon points="913,49 955,82 913,115 871,82" fill={C.diamond} />
        <text x={913} y={79} textAnchor="middle" fill={td} fontSize={10} fontWeight="600">Known Task</text>
        <text x={913} y={92} textAnchor="middle" fill={td} fontSize={10} fontWeight="600">Found?</text>

        {/* Diamond → Yes (up) */}
        <path d="M 955 82 L 978 82 L 978 46 L 1010 46" stroke={ac} strokeWidth={1.5} fill="none" markerEnd="url(#arr)" />
        <text x={965} y={75} textAnchor="middle" fill="#666" fontSize={9} fontStyle="italic">Yes</text>

        {/* Diamond → No (down) */}
        <path d="M 955 82 L 978 82 L 978 118 L 1010 118" stroke={ac} strokeWidth={1.5} fill="none" markerEnd="url(#arr)" />
        <text x={965} y={100} textAnchor="middle" fill="#666" fontSize={9} fontStyle="italic">No</text>

        {/* 9. Fetch Structured Instructions from Supabase */}
        <rect x={1015} y={20} width={152} height={52} rx={7} fill={C.green} />
        <text x={1091} y={39} textAnchor="middle" fill={td} {...fss}>Fetch Structured</text>
        <text x={1091} y={53} textAnchor="middle" fill={td} {...fss}>Instructions</text>
        <text x={1091} y={67} textAnchor="middle" fill={td} {...fss}>from Supabase</text>

        {/* 10. Fallback LLM Help */}
        <rect x={1015} y={98} width={125} height={40} rx={7} fill={C.green} />
        <text x={1077} y={115} textAnchor="middle" fill={td} {...fss}>Fallback LLM</text>
        <text x={1077} y={129} textAnchor="middle" fill={td} {...fss}>Help</text>

        {/* Merge: Yes + No → Step-by-Step */}
        <path d="M 1167 46 L 1190 46 L 1190 82" stroke={ac} strokeWidth={1.5} fill="none" />
        <path d="M 1140 118 L 1190 118 L 1190 82" stroke={ac} strokeWidth={1.5} fill="none" />
        <line x1={1190} y1={82} x2={1215} y2={82} stroke={ac} strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* 11. Step-by-Step Voice Guidance */}
        <rect x={1220} y={59} width={148} height={46} rx={7} fill={C.eleven} />
        <text x={1294} y={79} textAnchor="middle" fill={td} {...fss}>Step-by-Step</text>
        <text x={1294} y={93} textAnchor="middle" fill={td} {...fss}>Voice Guidance</text>
        <line x1={1368} y1={82} x2={1393} y2={82} stroke={ac} strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* 12. Call Summary + Memory Storage */}
        <rect x={1398} y={55} width={148} height={54} rx={7} fill={C.green} />
        <text x={1472} y={75} textAnchor="middle" fill={td} {...fss}>Call Summary +</text>
        <text x={1472} y={89} textAnchor="middle" fill={td} {...fss}>Memory Storage</text>
        <line x1={1546} y1={82} x2={1573} y2={82} stroke={ac} strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* 13. Supabase */}
        <rect x={1578} y={62} width={90} height={40} rx={7} fill={C.green} />
        <text x={1623} y={86} textAnchor="middle" fill={td} {...fs}>Supabase</text>
      </svg>
    </div>
  );
}

// ── Demo: Voice personalisation UI ───────────────────────────────────────────
function VoiceSetupDemo() {
  const [voice, setVoice] = useState("emily");
  const [speed, setSpeed] = useState(0.9);
  const [repetition, setRepetition] = useState(3);
  const [metaphorMode, setMetaphorMode] = useState(true);
  const [sensitiveFlows, setSensitiveFlows] = useState(false);
  const [saved, setSaved] = useState(false);
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  return (
    <div className="bg-white rounded-2xl border border-[#e8e4de] p-6 shadow-sm w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1208]">Agent configuration</h3>
          <p className="text-xs text-[#888] mt-0.5">Tune voice, pacing, and teaching style.</p>
        </div>
        <button onClick={handleSave} className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${saved ? "bg-[#e8f3ee] text-[#2d6a4f]" : "bg-[#1a1208] text-white hover:bg-[#3d2d1a]"}`}>
          {saved ? "Saved ✓" : "Save"}
        </button>
      </div>
      <div className="grid gap-4 grid-cols-2">
        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-xs font-medium text-[#1a1208]">Voice</label>
          <select value={voice} onChange={e => setVoice(e.target.value)} className="w-full rounded-xl border border-[#e8e4de] bg-white px-3 py-2.5 text-sm text-[#1a1208] outline-none focus:border-[#e07438]">
            <option value="emily">Emily (Female · Warm)</option>
            <option value="james">James (Male · Calm)</option>
            <option value="sofia">Sofia (Female · Bright)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-[#1a1208]">Speaking speed</label>
            <span className="text-xs font-semibold text-[#e07438]">{speed.toFixed(1)}x</span>
          </div>
          <input type="range" min="0.5" max="1.5" step="0.1" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-full accent-[#e07438]" />
          <div className="flex justify-between"><span className="text-[10px] text-[#aaa]">Slower</span><span className="text-[10px] text-[#aaa]">Faster</span></div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-[#1a1208]">Repetition level</label>
            <span className="text-xs font-semibold text-[#e07438]">{repetition}</span>
          </div>
          <input type="range" min="1" max="5" step="1" value={repetition} onChange={e => setRepetition(Number(e.target.value))} className="w-full accent-[#e07438]" />
          <div className="flex justify-between"><span className="text-[10px] text-[#aaa]">Less</span><span className="text-[10px] text-[#aaa]">More</span></div>
        </div>
        <div className="flex items-center justify-between col-span-2 rounded-xl border border-[#e8e4de] px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-[#1a1208]">Metaphor-Teaching Mode</p>
            <p className="text-[10px] text-[#888] mt-0.5">"Think of this like your TV remote…"</p>
          </div>
          <ToggleSwitch checked={metaphorMode} onChange={setMetaphorMode} />
        </div>
        <div className="flex items-center justify-between col-span-2 rounded-xl border border-[#e8e4de] px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-[#1a1208]">Allow sensitive flows</p>
            <p className="text-[10px] text-[#888] mt-0.5">Banking, medical, and legal guidance.</p>
          </div>
          <ToggleSwitch checked={sensitiveFlows} onChange={setSensitiveFlows} />
        </div>
      </div>
    </div>
  );
}

// ── Demo: Dashboard UI ────────────────────────────────────────────────────────
function DashboardDemo() {
  const [alertDismissed, setAlertDismissed] = useState(false);
  const mockCalls = [
    { date: "Apr 25, 3:42 PM", duration: "4m 12s", intent: "Password Reset", status: "completed" },
    { date: "Apr 24, 11:15 AM", duration: "2m 45s", intent: "App Store Help", status: "completed" },
    { date: "Apr 23, 9:30 AM", duration: "1m 20s", intent: "Suspicious Call", status: "scam_blocked" },
  ];
  return (
    <div className="bg-white rounded-2xl border border-[#e8e4de] overflow-hidden shadow-sm w-full">
      <div className="grid grid-cols-3 divide-x divide-[#e8e4de] border-b border-[#e8e4de]">
        {[
          { label: "Total Calls", value: "12", sub: "Last 30 days", danger: false },
          { label: "Scam Alerts", value: alertDismissed ? "0" : "1", sub: "Active", danger: !alertDismissed },
          { label: "Protected Users", value: "1", sub: "Currently linked", danger: false },
        ].map(s => (
          <div key={s.label} className="px-4 py-4">
            <p className="text-[10px] uppercase tracking-wider text-[#888] font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1.5 ${s.danger ? "text-red-600" : "text-[#1a1208]"}`}>{s.value}</p>
            <p className="text-[10px] text-[#aaa] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
      {!alertDismissed && (
        <div className="flex items-center gap-3 px-5 py-3 bg-red-50 border-b border-[#e8e4de]">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-700">Scam alert — Margaret</p>
            <p className="text-[10px] text-red-500 truncate">Keywords: "gift cards", "urgent transfer" · Apr 23</p>
          </div>
          <button onClick={() => setAlertDismissed(true)} className="text-[10px] border border-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition-colors flex-shrink-0">Dismiss</button>
        </div>
      )}
      <div className="px-5 py-3 border-b border-[#e8e4de] flex items-center justify-between">
        <p className="text-xs font-semibold text-[#1a1208]">Recent calls</p>
        <span className="text-[10px] text-[#e07438] font-medium">View all →</span>
      </div>
      <table className="w-full">
        <thead className="bg-[#f5f4f0] border-b border-[#e8e4de]">
          <tr>{["Date", "Duration", "Intent", "Status"].map(h => <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-[#888]">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[#e8e4de]">
          {mockCalls.map((call, i) => (
            <tr key={i} className="hover:bg-[#fdf9f4] transition-colors">
              <td className="px-4 py-3 text-xs font-medium text-[#1a1208]">{call.date}</td>
              <td className="px-4 py-3 text-xs text-[#666]">{call.duration}</td>
              <td className="px-4 py-3 text-xs text-[#666]">{call.intent}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${call.status === "completed" ? "bg-[#e8f3ee] text-[#2d6a4f]" : call.status === "scam_blocked" ? "bg-red-50 text-red-600" : "bg-[#f5f4f0] text-[#666]"}`}>
                  {call.status === "completed" ? "Completed" : call.status === "scam_blocked" ? "Blocked" : call.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURE_CARDS = [
  { num: "01 / 04", iconBg: "rgba(224,116,56,.12)", icon: <IconPhone />, title: "Zero-Friction", text: "No apps to navigate, and no web searching required. Help is one phone call away.", tagBg: "#fff3cc", tagColor: "#a06a00", tag: "No smartphone skills required" },
  { num: "02 / 04", iconBg: "rgba(74,127,193,.1)", icon: <IconWave />, title: "Adaptive Tone", text: "Coco listens and adjusts in real-time. If the senior sounds confused, Coco slows down; if they struggle to hear, it speaks louder—all while maintaining a warm, human-like tone.", tagBg: "rgba(74,127,193,.1)", tagColor: "#2f5e9e", tag: "Powered by Gemini" },
  { num: "03 / 04", iconBg: "rgba(192,57,43,.08)", icon: <IconAlertTriangle />, title: "Active Scam Detection", text: "While assisting, Coco monitors for high-risk language. If a conversation shifts toward a suspicious bank transfer or a known scam tactic, Coco intervenes and instantly notifies you.", tagBg: "rgba(192,57,43,.08)", tagColor: "#c0392b", tag: "Real-time caretaker alerts" },
  { num: "04 / 04", iconBg: "rgba(61,140,106,.1)", icon: <IconShield />, title: "Security Guardrails", text: "Safety is built-in. Coco proactively reminds users never to share sensitive data like passwords or PINs, acting as a constant digital bodyguard during every task.", tagBg: "rgba(61,140,106,.09)", tagColor: "#2d6e52", tag: "Always protected" },
];

const PROBLEMS = [
  { icon: "😓", title: "Reducing Burden", text: "You want to be patient, but spending an hour explaining a password reset over the phone can be draining. It turns quality family time into a stressful tech support session." },
  { icon: "🏢", title: "The Help Gap", text: "Commercial tech support can be jargon-heavy, impatient, and have long wait times. It's not designed for seniors, and it shows." },
  { icon: "🎣", title: "Scams and Security", text: "Digital confusion is the primary gateway for scammers. Without a trusted \"second opinion,\" a simple software update can lead to a devastating financial loss." },
  { icon: "🏠", title: "Growing Isolation", text: "As banking and healthcare move entirely online, seniors who struggle with tech don't just lose an app—they lose their independence." },
];

const TECH_STACK = [
  { name: "ElevenLabs", file: "elevenlabs.png", role: "Voice Synthesis" },
  { name: "Gemini", file: "gemini.png", role: "AI Understanding" },
  { name: "Twilio", file: "twilio.png", role: "Call Routing" },
  { name: "Supabase", file: "supabase.png", role: "Database & Auth" },
  { name: "Next.js", file: "nextjs.png", role: "Full-Stack Framework" },
  { name: "Vercel", file: "vercel.png", role: "Deployment" },
];

const SECTIONS = ["hero", "problem", "solution", "caretakers", "cta"];

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeCard, setActiveCard] = useState(0);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const currentSectionIdxRef = useRef(0);

  const N        = FEATURE_CARDS.length;
  const leftIdx  = (activeCard - 1 + N) % N;
  const rightIdx = (activeCard + 1) % N;

  function scrollToSection(idx: number) {
    const clamped = Math.max(0, Math.min(idx, SECTIONS.length - 1));
    document.getElementById(SECTIONS[clamped])?.scrollIntoView({ behavior: "smooth" });
    currentSectionIdxRef.current = clamped;
    setCurrentSectionIdx(clamped);
  }

  // Scroll: progress bar + nav blur + section tracking
  useEffect(() => {
    const onScroll = () => {
      const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      const prog = document.getElementById("lp-progress");
      if (prog) prog.style.width = pct + "%";

      const nav = document.getElementById("lp-nav");
      if (nav) {
        if (window.scrollY > 40) {
          nav.style.background     = "rgba(253,249,244,.9)";
          nav.style.backdropFilter = "blur(16px)";
          nav.style.borderBottom   = "1px solid #f3ebe0";
        } else {
          nav.style.background     = "transparent";
          nav.style.backdropFilter = "none";
          nav.style.borderBottom   = "none";
        }
      }

      // Track active section
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i]);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.5) {
          if (currentSectionIdxRef.current !== i) {
            currentSectionIdxRef.current = i;
            setCurrentSectionIdx(i);
          }
          break;
        }
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

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); scrollToSection(currentSectionIdxRef.current + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); scrollToSection(currentSectionIdxRef.current - 1); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-[#fdf9f4] text-[#1c1309] overflow-x-hidden font-[var(--font-dm-sans,DM_Sans,sans-serif)]">

      {/* Progress bar */}
      <div id="lp-progress" className="fixed top-0 left-0 h-[2px] bg-[#f5a800] z-[1000] transition-[width] duration-100 ease-linear" style={{ width: "0%" }} />

      {/* Section navigation dots */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[998] hidden lg:flex flex-col gap-3 items-center">
        {SECTIONS.map((id, i) => (
          <button
            key={id}
            onClick={() => scrollToSection(i)}
            title={id.charAt(0).toUpperCase() + id.slice(1)}
            className={`rounded-full transition-all duration-300 ${currentSectionIdx === i ? "w-2 h-6 bg-[#e07438]" : "w-2 h-2 bg-[#ecdecb] hover:bg-[#e07438]/60"}`}
          />
        ))}
      </div>

      {/* ── Nav ── */}
      <nav id="lp-nav" className="fixed top-0 left-0 right-0 z-[999] flex items-center px-5 sm:px-10 md:px-[60px] py-[18px] transition-all duration-300">
        <a href="#" className="flex items-center no-underline shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Coco" className="h-9 w-auto" />
        </a>

        {/* Truly centered links */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {[
            { href: "#problem",    label: "Problem" },
            { href: "#solution",   label: "Features" },
            { href: "#caretakers", label: "For Caretakers" },
          ].map(({ href, label }) => (
            <a key={href} href={href} className="lp-nav-link text-sm text-[#6b5e4a] no-underline">{label}</a>
          ))}
        </div>

        <Link href="/auth/signup" className="lp-nav-cta bg-[#1c1309] text-[#fdf9f4] py-[9px] px-[22px] rounded-[10px] text-sm font-semibold no-underline ml-auto">
          Get started →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-[#fdf9f4] px-5 sm:px-10 md:px-[60px] pt-[140px] pb-[80px]">
        <div className="absolute pointer-events-none" style={{ top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 900, height: 600, background: "radial-gradient(ellipse,rgba(245,168,0,.10) 0%,transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,rgba(180,140,80,.18) 1px,transparent 1px)", backgroundSize: "36px 36px", maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%,black,transparent)" }} />

        <div className="lp-anim-eyebrow inline-flex items-center gap-2 bg-[#fff3cc] border border-[rgba(245,168,0,.35)] rounded-[20px] py-[6px] px-4 text-[12.5px] font-semibold text-[#a06a00] tracking-[.05em] uppercase mb-7">
          <span className="w-[6px] h-[6px] bg-[#e07438] rounded-full shrink-0" style={{ animation: "lp-pulse 2s infinite" }} />
          A new kind of tech support
        </div>
        <h1 className="lp-anim-title font-bold leading-none mb-6 text-[#1c1309] tracking-[-3px]" style={{ fontSize: "clamp(52px,9vw,116px)" }}>
          Meet <span className="text-[#e07438]">Coco.</span>
        </h1>
        <p className="lp-anim-sub text-[#6b5e4a] max-w-[520px] leading-[1.7] mx-auto font-normal" style={{ fontSize: "clamp(15px,1.6vw,20px)" }}>
          A <strong className="text-[#1c1309] font-semibold">voice AI</strong> your loved ones can call any time for tech support. 
        </p>
        <div className="lp-anim-actions flex flex-wrap items-center gap-3 justify-center mt-11">
          <Link href="/auth/signup" className="lp-btn-primary bg-[#1c1309] text-[#fdf9f4] py-[14px] px-8 rounded-xl text-[15px] font-bold no-underline inline-flex items-center gap-2">
            Get early access <IconArrowRight />
          </Link>
          <a href="#problem" className="lp-btn-ghost text-[#6b5e4a] py-[14px] px-6 rounded-xl text-[15px] font-medium no-underline inline-flex items-center gap-2 border border-[#ecdecb]">
            See the problem →
          </a>
        </div>

        <div className="lp-anim-phone mt-[72px] relative inline-block">
          <div className="relative overflow-hidden rounded-[36px] border border-[#ecdecb]" style={{ width: 260, height: 480, background: "linear-gradient(160deg,#fffcf7,#fdf3e3)", boxShadow: "0 40px 80px rgba(28,19,9,.12),0 0 0 1px rgba(245,168,0,.08)" }}>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[70px] h-[6px] bg-[#ecdecb] rounded-full" />
            <div className="absolute inset-3 bg-[#faf5ec] rounded-[26px] flex flex-col items-center justify-center gap-3.5 p-5">
              <div className="flex items-center gap-1.5 bg-[#fff3cc] border border-[rgba(245,168,0,.3)] rounded-[20px] py-[5px] px-3">
                <div className="w-[6px] h-[6px] bg-[#e07438] rounded-full" style={{ animation: "lp-pulse 1.5s infinite" }} />
                <span className="text-[11px] text-[#a06a00] font-semibold">Call in progress</span>
              </div>
              <WaveBars delays={[0, .1, .2, .3, .2, .1, 0]} />
              <div className="text-[11px] text-[#9e8e7a] tracking-[.06em] uppercase">Coco is speaking</div>
            </div>
          </div>
          <div className="absolute bg-white border border-[#ecdecb] rounded-xl px-3.5 py-2.5 whitespace-nowrap" style={{ right: -80, top: 60, boxShadow: "0 4px 20px rgba(28,19,9,.08)", animation: "lp-float-badge 4s ease-in-out infinite" }}>
            <div className="text-[10.5px] text-[#9e8e7a] mb-0.5">Scam Shield</div>
            <div className="text-[13px] font-semibold text-[#1c1309]">🛡 Active</div>
          </div>
          <div className="absolute bg-white border border-[#ecdecb] rounded-xl px-3.5 py-2.5 whitespace-nowrap" style={{ left: -100, bottom: 80, boxShadow: "0 4px 20px rgba(28,19,9,.08)", animation: "lp-float-badge 4s ease-in-out infinite", animationDelay: "-2s" }}>
            <div className="text-[10.5px] text-[#9e8e7a] mb-0.5">Caretaker notified</div>
            <div className="text-[13px] font-semibold text-[#1c1309]">SMS sent</div>
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section id="problem" className="bg-[#fff8ee] px-5 sm:px-10 md:px-[60px] py-16 md:py-[120px]">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-[800px] mb-12 md:mb-16">
            <div className="lp-reveal-l text-[11.5px] font-bold tracking-[.12em] uppercase text-[#e07438] mb-3.5">The Problem</div>
            <h2 className="lp-reveal-l font-bold leading-[1.08] text-[#1c1309] tracking-[-1.5px] mb-5" style={{ fontSize: "clamp(30px,5vw,56px)" }}>
              Our parents deserve <span className="lp-underline-anim">better</span><br />than being left behind.
            </h2>
            <p className="lp-reveal-l text-[16px] md:text-[17px] text-[#6b5e4a] leading-[1.7]">
              Technology moves fast. The people who raised us can&apos;t always keep up. And the systems meant to help them often make things worse.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="lp-reveal-s lp-problem-card bg-white rounded-2xl p-6 md:p-8 border border-[#ecdecb] flex gap-5 items-center" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="text-4xl shrink-0">{p.icon}</div>
                <div>
                  <h3 className="text-[16px] md:text-[17px] font-bold text-[#1c1309] mb-2 tracking-[-0.3px]">{p.title}</h3>
                  <p className="text-[14px] md:text-[15px] text-[#6b5e4a] leading-[1.7]">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution / Features Carousel ── */}
      <section id="solution" className="bg-[#1c1309] overflow-hidden py-16 md:py-[120px]">
        <div className="text-center max-w-[1000px] mx-auto mb-12 md:mb-16 px-5 sm:px-10 md:px-[60px]">
          <div className="lp-reveal text-[11.5px] font-bold tracking-[.12em] uppercase text-[#e07438] mb-3.5">Our solution</div>
          <h2 className="lp-reveal font-bold leading-[1.08] text-white tracking-[-1.5px]" style={{ fontSize: "clamp(30px,5vw,56px)" }}>
            Everything seniors need.<br />Everything caretakers want.
          </h2>
          <p className="lp-reveal text-[16px] md:text-[17px] text-[#9e8e7a] leading-[1.7] max-w-[640px] mx-auto mt-4">
            Coco is a voice-first AI assistant accessible through a simple phone call. Designed for seniors and trusted by families, Coco provides warm, on-demand technical support.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden h-[460px] sm:h-[500px] md:h-[520px]">
          {/* Left card — hidden on mobile */}
          <div className="hidden sm:block absolute top-1/2 cursor-pointer" style={{ width: 480, left: "50%", transform: "translate(calc(-50% - 430px), -50%) scale(0.88)", opacity: 0.6, zIndex: 5, transition: "all 0.55s cubic-bezier(.22,1,.36,1)" }} onClick={() => setActiveCard(leftIdx)}>
            <FeatureCardInner card={FEATURE_CARDS[leftIdx]} isActive={false} />
          </div>

          {/* Center card */}
          <div className="absolute top-1/2" style={{ width: "min(540px, calc(100vw - 32px))", left: "50%", transform: "translate(-50%, -50%) scale(1)", opacity: 1, zIndex: 10, transition: "all 0.55s cubic-bezier(.22,1,.36,1)" }}>
            <div key={activeCard} style={{ animation: "lp-card-enter 0.45s cubic-bezier(.22,1,.36,1) both" }}>
              <FeatureCardInner card={FEATURE_CARDS[activeCard]} isActive={true} />
            </div>
          </div>

          {/* Right card — hidden on mobile */}
          <div className="hidden sm:block absolute top-1/2 cursor-pointer" style={{ width: 480, left: "50%", transform: "translate(calc(-50% + 430px), -50%) scale(0.88)", opacity: 0.6, zIndex: 5, transition: "all 0.55s cubic-bezier(.22,1,.36,1)" }} onClick={() => setActiveCard(rightIdx)}>
            <FeatureCardInner card={FEATURE_CARDS[rightIdx]} isActive={false} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={() => setActiveCard(leftIdx)} className="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"><IconChevLeft /></button>
          {Array.from({ length: N }, (_, i) => (
            <div key={i} onClick={() => setActiveCard(i)} className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${activeCard === i ? "w-6 bg-[#e07438]" : "w-2 bg-white/30"}`} />
          ))}
          <button onClick={() => setActiveCard(rightIdx)} className="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"><IconChevRight /></button>
        </div>
      </section>

      {/* ── Caretaker peace of mind ── */}
      <section id="caretakers" className="bg-white px-5 sm:px-10 md:px-[60px] py-16 md:py-[120px]">
        <div className="max-w-[1100px] mx-auto flex flex-col gap-16 md:gap-24">

          <div className="max-w-[560px]">
            <div className="text-[11.5px] font-bold uppercase text-[#e07438] mb-3">Caretaker peace of mind</div>
            <h2 className="font-bold leading-[1.1] tracking-[-1px]" style={{ fontSize: "clamp(32px,4vw,48px)" }}>
              Always informed.<br />Never intrusive.
            </h2>
          </div>

          {/* Personalise for their needs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div className="pt-2">
              <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-[-0.5px]">Personalise for their needs</h3>
              <p className="text-[15px] md:text-[16px] text-[#6b5e4a] leading-[1.75]">
                Tailor the experience to your loved one&apos;s specific needs. Customize Coco&apos;s voice, gender, and speed, and set the tech comfort level—from beginners to those who just need a light nudge. You can even specify their device type (iPhone/Android) so Coco&apos;s instructions match exactly what they see on their screen.
              </p>
            </div>
            <VoiceSetupDemo />
          </div>

          {/* Stay involved */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div className="pt-2">
              <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-[-0.5px]">Stay involved</h3>
              <p className="text-[15px] md:text-[16px] text-[#6b5e4a] leading-[1.75]">
                Stay informed through a dedicated dashboard that tracks past calls and high-level topics, with flags for tasks where they struggled. Receive instant alerts if a potential scam or high-risk activity is detected.
              </p>
            </div>
            <DashboardDemo />
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta" className="bg-[#fff8ee] text-center px-5 sm:px-10 md:px-[60px] py-20 md:py-[140px]">
        <div className="max-w-[640px] mx-auto">
          <div className="lp-reveal flex justify-center text-[11.5px] font-bold tracking-[.12em] uppercase text-[#e07438] mb-3.5">Get started</div>
          <h2 className="lp-reveal font-bold leading-[1.05] text-[#1c1309] mb-[18px] tracking-[-2px]" style={{ fontSize: "clamp(34px,6vw,68px)" }}>
            Give your loved one<br />the help they deserve.<br /><span className="text-[#e07438]">On their terms.</span>
          </h2>
          <p className="lp-reveal text-base md:text-lg text-[#6b5e4a] max-w-[440px] mx-auto mb-11 leading-[1.65]">
            Set up takes 5 minutes. Your loved one never has to touch a screen.
          </p>
          <div className="lp-reveal">
            <Link href="/auth/signup" className="lp-btn-cta bg-[#e07438] text-white py-[18px] px-11 rounded-[14px] text-[17px] font-bold no-underline inline-flex items-center gap-2.5" style={{ boxShadow: "0 8px 30px rgba(224,116,56,.3)" }}>
              Create a free account
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="bg-[#fdf9f4] py-16 md:py-[100px]">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-10 md:px-[60px]">
          <div className="text-center mb-10 md:mb-14">
            <div className="text-[11.5px] font-bold uppercase text-[#e07438] mb-3">Built with modern AI stack</div>
            <h2 className="font-bold tracking-[-1px] text-[#1c1309]" style={{ fontSize: "clamp(26px,3vw,36px)" }}>How Coco works</h2>
            <p className="text-[#6b5e4a] mt-3 max-w-[500px] mx-auto leading-[1.65] text-[15px] md:text-[16px]">
              A purpose-built pipeline that turns a simple phone call into an intelligent, safe, and personalised support session.
            </p>
          </div>

          {/* Architecture diagram */}
          <div className="mb-12 md:mb-16">
            <ArchDiagram />
          </div>

          {/* Tech logos — static horizontal list */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {TECH_STACK.map((tech) => (
              <div key={tech.name} className="flex flex-col items-center gap-2">
                <div className="h-9 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/tech/${tech.file}`} alt={tech.name} className="h-full w-auto object-contain max-w-[80px]" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <p className="text-xs font-semibold text-[#6b5e4a]">{tech.name}</p>
                <p className="text-[10px] text-[#9e8e7a]">{tech.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#fdf9f4] border-t border-[#f3ebe0] px-5 sm:px-10 md:px-[60px] py-10 md:py-12 relative flex items-center">
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Coco" className="h-7 w-auto" />
        </div>

        {/* Truly centered links */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-7">
          {[
            { href: "#problem",    label: "Problem" },
            { href: "#solution",   label: "Features" },
            { href: "#caretakers", label: "For Caretakers" },
          ].map(({ href, label }) => (
            <a key={href} href={href} className="lp-footer-link text-[13px] text-[#9e8e7a] no-underline">{label}</a>
          ))}
        </div>

        <div className="text-xs text-[#9e8e7a] ml-auto">© 2026 Coco AI · Built with ♥ for the ones we love</div>
      </footer>

    </div>
  );
}

// ── Feature card inner ────────────────────────────────────────────────────────
function FeatureCardInner({ card, isActive }: { card: typeof FEATURE_CARDS[number]; isActive: boolean }) {
  return (
    <div className={`bg-white rounded-3xl px-7 md:px-9 py-8 md:py-10 relative overflow-hidden border transition-all ${isActive ? "border-[rgba(245,168,0,.4)] shadow-[0_24px_60px_rgba(28,19,9,.18)]" : "border-[#ecdecb]"}`}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(140deg,rgba(245,168,0,.04),transparent 60%)" }} />
      <div className="text-[11px] font-bold tracking-[.12em] uppercase text-[#9e8e7a] mb-6">{card.num}</div>
      <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-5" style={{ background: card.iconBg }}>{card.icon}</div>
      <div className="text-[20px] md:text-[22px] font-bold text-[#1c1309] mb-3 tracking-[-0.4px]">{card.title}</div>
      <div className="text-[14px] md:text-[15px] text-[#6b5e4a] leading-[1.72]">{card.text}</div>
      <div className="inline-flex items-center gap-[5px] rounded-[20px] py-[5px] px-3 text-[11.5px] font-bold mt-5 tracking-[.03em]" style={{ background: card.tagBg, color: card.tagColor }}>{card.tag}</div>
    </div>
  );
}
