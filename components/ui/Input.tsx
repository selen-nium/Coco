"use client";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#1a1208]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border border-[#e8e4de] bg-white px-4 py-3 text-sm text-[#1a1208] placeholder:text-[#bbb] outline-none focus:border-[#e8733b] focus:ring-2 focus:ring-[#e8733b]/20 transition ${error ? "border-red-400" : ""} ${className}`}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#888]">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
