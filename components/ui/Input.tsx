import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 ${
          error
            ? "border-rose-300 bg-rose-50 focus:border-rose-500"
            : "border-slate-200 bg-white focus:border-emerald-500"
        } ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
