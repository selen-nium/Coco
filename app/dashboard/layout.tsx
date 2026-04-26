import { requireAuthenticatedCaretaker } from "@/app/api/dashboard/_lib/auth";
import { NavLink } from "@/components/dashboard/NavLink";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedCaretaker>>;
  try {
    auth = await requireAuthenticatedCaretaker();
  } catch {
    // Sign out to clear any stale session cookie so the middleware
    // doesn't redirect /auth/login back to /dashboard on next visit.
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth/login");
  }
  const { supabase, caretaker } = auth;
  const { data: elderlyUsers } = await supabase
    .from("elderly_users")
    .select("id, name, age, nickname")
    .eq("caretaker_id", caretaker.id)
    .order("created_at", { ascending: false });

  const primaryUser = elderlyUsers?.[0];
  const firstName = caretaker.name?.split(" ")[0] ?? caretaker.name;

  return (
    <div className="flex min-h-screen bg-[#f5f4f0]">
      <aside className="flex w-60 shrink-0 flex-col bg-[#17120a] min-h-screen sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/8">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8733b]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C5.79 2 4 3.79 4 6c0 1.48.81 2.77 2 3.46V8h4V7.46C11.19 5.77 12 4.48 12 3c0-2.21-1.79-4-4-4z" fill="white" opacity=".9"/>
              <rect x="6" y="8" width="4" height="1.5" rx=".75" fill="white" opacity=".7"/>
              <rect x="6.5" y="10" width="3" height="1" rx=".5" fill="white" opacity=".5"/>
            </svg>
          </div>
          <span className="font-semibold text-white tracking-tight">Coco</span>
        </div>

        {/* Linked user card */}
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

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-2 mt-4">
          <NavLink href="/dashboard" label="Dashboard" exact />
          <NavLink href="/dashboard/calls" label="Call History" />
          <NavLink href="/dashboard/config" label="Settings" />
        </nav>

        {/* Caretaker footer */}
        <div className="mt-auto border-t border-white/8 px-4 py-4">
          <p className="text-sm font-semibold text-white leading-tight">{firstName}</p>
          <p className="text-xs text-[#8a7a6a] mt-0.5 truncate">{caretaker.email}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-8 overflow-auto">{children}</main>
    </div>
  );
}
