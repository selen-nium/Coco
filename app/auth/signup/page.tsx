"use client";

// TODO (Agent 3): implement signup form — creates Supabase Auth user + caretakers row
export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-gray-500 text-sm">Set up your caretaker profile</p>
        {/* TODO (Agent 3): name, email, phone, password fields */}
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 bg-indigo-100 rounded animate-pulse" />
      </div>
    </div>
  );
}
