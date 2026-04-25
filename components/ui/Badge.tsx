import type { PropsWithChildren } from "react";

export function Badge({
  children,
  tone = "neutral",
}: PropsWithChildren<{ tone?: "neutral" | "critical" | "high" | "success" }>) {
  const toneClasses = {
    neutral: "bg-slate-100 text-slate-700",
    critical: "bg-rose-100 text-rose-700",
    high: "bg-amber-100 text-amber-700",
    success: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
