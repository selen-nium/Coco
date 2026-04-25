import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  auth_user_id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  email: z.string().email(),
  phone: z.string().trim().min(7).max(40).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { auth_user_id, name, email, phone } = parsed.data;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== auth_user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from("caretakers")
      .select("id")
      .eq("auth_user_id", auth_user_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ id: existing.id });
    }

    const { data, error } = await supabase
      .from("caretakers")
      .insert({ auth_user_id, name, email, phone: phone ?? null })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error("[api/auth/caretaker]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
