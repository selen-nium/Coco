"use client";

// TODO (Agent 3): implement login form with Supabase Auth (email + password)
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Sign in to Coco</h1>
        <p className="text-gray-500 text-sm">Caretaker portal</p>
        {/* TODO (Agent 3): email + password fields, Supabase signInWithPassword */}
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 bg-indigo-100 rounded animate-pulse" />
      </div>
    </div>
  );
}
