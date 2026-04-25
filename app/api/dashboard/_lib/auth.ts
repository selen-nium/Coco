import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();

export async function requireAuthenticatedCaretaker() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("UNAUTHORIZED");
  }

  const { data: caretaker, error: caretakerError } = await supabase
    .from("caretakers")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (caretakerError) {
    throw caretakerError;
  }

  if (!caretaker) {
    throw new Error("CARETAKER_NOT_FOUND");
  }

  return { supabase, user, caretaker };
}

export async function requireCaretakerIdMatch(id: string) {
  const parsedId = idSchema.safeParse(id);

  if (!parsedId.success) {
    throw new Error("INVALID_ID");
  }

  const context = await requireAuthenticatedCaretaker();

  if (context.caretaker.id !== parsedId.data) {
    throw new Error("FORBIDDEN");
  }

  return context;
}

export async function requireOwnedElderlyUser(elderlyUserId: string) {
  const parsedId = idSchema.safeParse(elderlyUserId);

  if (!parsedId.success) {
    throw new Error("INVALID_ID");
  }

  const context = await requireAuthenticatedCaretaker();
  const { data: elderlyUser, error } = await context.supabase
    .from("elderly_users")
    .select("*")
    .eq("id", parsedId.data)
    .eq("caretaker_id", context.caretaker.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!elderlyUser) {
    throw new Error("ELDERLY_USER_NOT_FOUND");
  }

  return { ...context, elderlyUser };
}

export function responseForError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  switch (message) {
    case "UNAUTHORIZED":
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    case "FORBIDDEN":
      return Response.json({ error: "Forbidden" }, { status: 403 });
    case "CARETAKER_NOT_FOUND":
    case "ELDERLY_USER_NOT_FOUND":
      return Response.json({ error: "Not found" }, { status: 404 });
    case "INVALID_ID":
      return Response.json({ error: "Invalid identifier" }, { status: 400 });
    default:
      return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
