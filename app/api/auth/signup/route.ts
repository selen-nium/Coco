import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Plain admin client — auth.admin requires service role, not the SSR cookie client
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = schema.parse(body);

    const supabase = getAdminClient();

    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const alreadyExists = existing?.users?.some(u => u.email === email);
    if (alreadyExists) {
      return NextResponse.json({ error: "An account with this email already exists. Please sign in instead." }, { status: 400 });
    }

    // Create user without sending any email
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.user.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
