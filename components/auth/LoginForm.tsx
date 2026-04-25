"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!password) nextErrors.password = "Password is required.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrors({ form: error.message });
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        error={errors.email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Input
        label="Password"
        type="password"
        value={password}
        error={errors.password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Your password"
        autoComplete="current-password"
      />
      {errors.form ? (
        <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {errors.form}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
      <p className="text-center text-sm text-[#888]">
        New to Coco?{" "}
        <Link href="/auth/signup" className="font-medium text-[#e8733b] hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
