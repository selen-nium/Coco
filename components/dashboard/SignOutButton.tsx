"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full rounded-lg px-3 py-2 text-xs font-medium text-[#8a7a6a] hover:bg-white/6 hover:text-white transition-colors text-left"
    >
      Sign out
    </button>
  );
}
