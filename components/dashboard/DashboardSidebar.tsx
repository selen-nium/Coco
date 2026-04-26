"use client";

import { useState } from "react";
import { NavLink } from "./NavLink";
import { SignOutButton } from "./SignOutButton";

interface SidebarProps {
  caretaker: { name: string; email: string };
  primaryUser: { name: string; age?: number | null; nickname?: string | null } | null;
}

export function DashboardSidebar({ caretaker, primaryUser }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firstName = caretaker.name?.split(" ")[0] ?? caretaker.name;

  const logoSvg = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2C5.79 2 4 3.79 4 6c0 1.48.81 2.77 2 3.46V8h4V7.46C11.19 5.77 12 4.48 12 3c0-2.21-1.79-4-4-4z" fill="white" opacity=".9"/>
      <rect x="6" y="8" width="4" height="1.5" rx=".75" fill="white" opacity=".7"/>
      <rect x="6.5" y="10" width="3" height="1" rx=".5" fill="white" opacity=".5"/>
    </svg>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[#17120a] px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8733b]">
            {logoSvg}
          </div>
          <span className="font-bold text-white text-sm tracking-tight">Coco</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {isOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#17120a] overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8733b]">
              {logoSvg}
            </div>
            <span className="font-semibold text-white tracking-tight">Coco</span>
          </div>
          <button 
            className="lg:hidden text-[#8a7a6a] hover:text-white transition-colors" 
            onClick={() => setIsOpen(false)}
            aria-label="Close Sidebar"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {primaryUser && (
          <div className="mx-3 mt-4 rounded-xl bg-white/6 border border-white/8 px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#8a7a6a]">Linked</p>
            <p className="mt-1 text-sm font-semibold text-white leading-tight">
              {primaryUser.nickname ?? primaryUser.name}
            </p>
            {primaryUser.age && (
              <p className="text-xs text-[#8a7a6a] mt-0.5">{primaryUser.age} years old</p>
            )}
          </div>
        )}

        <nav className="flex flex-col gap-0.5 px-2 mt-4" onClick={() => setIsOpen(false)}>
          <NavLink href="/dashboard" label="Dashboard" exact />
          <NavLink href="/dashboard/calls" label="Call History" />
          <NavLink href="/dashboard/config" label="Settings" />
        </nav>

        <div className="mt-auto border-t border-white/8 px-4 py-4">
          <p className="text-sm font-semibold text-white leading-tight">{firstName}</p>
          <p className="text-xs text-[#8a7a6a] mt-0.5 truncate">{caretaker.email}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
