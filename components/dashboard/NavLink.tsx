"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-[#e8733b] text-white"
          : "text-[#8a7a6a] hover:bg-white/6 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
