// TODO (Agent 3): replace placeholder sidebar with real nav links and user profile dropdown
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-6 px-4 gap-2 shrink-0">
        <div className="text-xl font-bold text-indigo-600 mb-6">Coco</div>
        {[
          { label: "Overview", href: "/dashboard" },
          { label: "Alerts", href: "/dashboard/alerts" },
          { label: "Call History", href: "/dashboard/calls" },
          { label: "Configuration", href: "/dashboard/config" },
          { label: "Flows", href: "/dashboard/flows" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-2 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
