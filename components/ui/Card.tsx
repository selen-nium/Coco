import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-2xl border border-[#e8e4de] bg-white ${className}`} {...props} />
  );
}
