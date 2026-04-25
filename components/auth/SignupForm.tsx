"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Errors = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  form?: string;
};

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Errors = {};
    if (name.trim().length < 2) nextErrors.name = "Full name is required.";
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (phone.trim().length < 7) nextErrors.phone = "Phone number looks too short.";
    if (password.length < 8) nextErrors.password = "Use at least 8 characters.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      setErrors({ form: error?.message ?? "Unable to create your account." });
      setIsSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase.from("caretakers").insert({
      auth_user_id: data.user.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });

    if (profileError) {
      setErrors({ form: profileError.message });
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        value={name}
        error={errors.name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Taylor Rivera"
        autoComplete="name"
      />
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
        label="Phone"
        type="tel"
        value={phone}
        error={errors.phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="+1 206 555 0148"
        autoComplete="tel"
      />
      <Input
        label="Password"
        type="password"
        value={password}
        error={errors.password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Create a password"
        autoComplete="new-password"
      />
      {errors.form ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errors.form}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create Account"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-emerald-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}
