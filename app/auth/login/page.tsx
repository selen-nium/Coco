"use client";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#d1fae5,_#f8fafc_45%)] px-4 py-16">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-2xl shadow-emerald-950/10 backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden bg-[linear-gradient(140deg,_#052e2b,_#0f766e_58%,_#6ee7b7)] p-10 text-white md:block">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-100">Coco Care</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Calm, real-time support for the people who need extra patience.
            </h1>
            <p className="mt-4 max-w-md text-sm text-emerald-50/85">
              Watch call history, tune the AI voice agent, and step in fast when
              scam risk appears.
            </p>
          </div>
          <div className="p-8 sm:p-10">
            <h1 className="text-3xl font-semibold text-slate-900">Sign in to Coco</h1>
            <p className="mt-2 text-sm text-slate-500">Caretaker portal</p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
