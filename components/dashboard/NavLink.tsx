"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-emerald-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
      }`}
    >
      {label}
    </Link>
  );
}
