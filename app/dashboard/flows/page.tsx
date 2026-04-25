// TODO (Agent 3): fetch ingested_flows, render table + "Add Flow" modal with step JSONB editor
export default function FlowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ingested Flows</h1>
        <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg opacity-50 cursor-not-allowed">
          + Add Flow
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-gray-400 text-sm">
          Flows list — Agent 3 implements CRUD UI + step JSON editor
        </p>
      </div>
    </div>
  );
}
