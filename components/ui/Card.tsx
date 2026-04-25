import type { PropsWithChildren } from "react";

export function Card({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/60 ${className}`}
    >
      {children}
    </div>
  );
}
