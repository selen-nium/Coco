"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
      primary: "bg-[#e8733b] text-white hover:bg-[#d4652f] active:scale-[0.98]",
      ghost: "text-[#6b6b6b] hover:bg-[#f0ede8]",
      outline: "border border-[#e8e4de] text-[#1a1208] hover:bg-[#f5f4f0]",
      danger: "bg-red-500 text-white hover:bg-red-600",
    };
    const sizes = { sm: "text-xs px-3 py-1.5", md: "text-sm px-5 py-2.5", lg: "text-base px-6 py-3" };
    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
