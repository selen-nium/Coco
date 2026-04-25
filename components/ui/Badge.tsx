import { HTMLAttributes } from "react";

type BadgeVariant = "green" | "red" | "amber" | "orange" | "gray" | "blue";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const styles: Record<BadgeVariant, string> = {
  green:  "bg-[#e8f3ee] text-[#2d6a4f]",
  red:    "bg-[#fde8e8] text-[#c0392b]",
  amber:  "bg-[#fef3e0] text-[#d97706]",
  orange: "bg-[#fff0e6] text-[#e8733b]",
  gray:   "bg-[#f0ede8] text-[#6b6b6b]",
  blue:   "bg-[#e8f0fe] text-[#3b5bdb]",
};

export function Badge({ variant = "gray", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
