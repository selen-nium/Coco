import { requireAuthenticatedCaretaker } from "@/app/api/dashboard/_lib/auth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedCaretaker>>;
  try {
    auth = await requireAuthenticatedCaretaker();
  } catch {
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

  const primaryUser = elderlyUsers?.[0] ?? null;

  return (
    <div className="flex min-h-screen bg-[#f5f4f0]">
      <DashboardSidebar caretaker={caretaker} primaryUser={primaryUser} />
      <main className="flex-1 min-w-0 p-6 lg:p-8 lg:ml-64 pt-20 lg:pt-8">{children}</main>
    </div>
  );
}
