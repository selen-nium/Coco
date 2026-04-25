import { requireAuthenticatedCaretaker } from "@/app/api/dashboard/_lib/auth";
import { NavLink } from "@/components/dashboard/NavLink";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { caretaker } = await requireAuthenticatedCaretaker();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ecfdf5,_#f8fafc_55%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="flex w-full max-w-72 shrink-0 flex-col rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-200/50 backdrop-blur">
          <div className="rounded-3xl bg-[linear-gradient(135deg,_#022c22,_#0f766e_60%,_#6ee7b7)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-100">Coco</p>
            <p className="mt-4 text-2xl font-semibold">Caretaker Console</p>
            <p className="mt-2 text-sm text-emerald-50/90">
              Keep support calls gentle, guided, and safer.
            </p>
          </div>

          <nav className="mt-6 flex flex-col gap-2">
            {[
              { label: "Overview", href: "/dashboard" },
              { label: "Alerts", href: "/dashboard/alerts" },
              { label: "Call History", href: "/dashboard/calls" },
              { label: "Configuration", href: "/dashboard/config" },
              { label: "Flows", href: "/dashboard/flows" },
            ].map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{caretaker.name}</p>
            <p className="mt-1 text-sm text-slate-500">{caretaker.email}</p>
            <div className="mt-4">
              <SignOutButton />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 py-2">{children}</main>
      </div>
    </div>
  );
}
