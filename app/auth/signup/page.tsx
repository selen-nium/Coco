"use client";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#a7f3d0,_#f8fafc_45%)] px-4 py-16">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-2xl shadow-emerald-950/10 backdrop-blur md:grid-cols-[1fr_1fr]">
          <div className="p-8 sm:p-10">
            <h1 className="text-3xl font-semibold text-slate-900">Create your account</h1>
            <p className="mt-2 text-sm text-slate-500">
              Set up your caretaker profile and start linking users.
            </p>
            <div className="mt-8">
              <SignupForm />
            </div>
          </div>
          <div className="hidden bg-[linear-gradient(145deg,_#0f172a,_#155e75_52%,_#14b8a6)] p-10 text-white md:block">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-100">Coco Voice</p>
            <h2 className="mt-6 text-4xl font-semibold leading-tight">
              Built for patient, step-by-step tech help over the phone.
            </h2>
            <p className="mt-4 max-w-md text-sm text-cyan-50/85">
              Give older adults a safer support line while caretakers keep eyes
              on mood, calls, and scam alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
