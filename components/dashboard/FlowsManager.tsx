"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Flow = {
  id: string;
  caretaker_id: string | null;
  name: string;
  app: string;
  description: string;
  steps: unknown[];
  created_at: string;
};

type Draft = {
  name: string;
  app: string;
  description: string;
  stepsText: string;
};

const emptyDraft: Draft = {
  name: "",
  app: "",
  description: "",
  stepsText:
    '[\n  {\n    "step": 1,\n    "instruction": "Open Settings",\n    "target": "Settings app",\n    "location": "Home screen",\n    "icon": "gear",\n    "validation": "Settings is open"\n  }\n]',
};

export function FlowsManager({ initialFlows }: { initialFlows: Flow[] }) {
  const [flows, setFlows] = useState(initialFlows);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const sortedFlows = useMemo(
    () => [...flows].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [flows]
  );

  function openCreate() {
    setEditingFlowId(null);
    setDraft(emptyDraft);
    setIsOpen(true);
    setStatus(null);
  }

  function openEdit(flow: Flow) {
    setEditingFlowId(flow.id);
    setDraft({
      name: flow.name,
      app: flow.app,
      description: flow.description,
      stepsText: JSON.stringify(flow.steps, null, 2),
    });
    setIsOpen(true);
    setStatus(null);
  }

  async function saveFlow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    let steps: unknown[];
    try {
      const parsed = JSON.parse(draft.stepsText);
      if (!Array.isArray(parsed)) throw new Error("Steps must be an array.");
      steps = parsed;
    } catch {
      setStatus("Steps JSON is invalid.");
      return;
    }

    const response = await fetch(
      editingFlowId ? `/api/dashboard/flows/${editingFlowId}` : "/api/dashboard/flows",
      {
        method: editingFlowId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          app: draft.app,
          description: draft.description,
          steps,
        }),
      }
    );

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Unable to save flow.");
      return;
    }

    if (editingFlowId) {
      setFlows((current) => current.map((flow) => (flow.id === payload.id ? payload : flow)));
    } else {
      setFlows((current) => [payload, ...current]);
    }

    setIsOpen(false);
    setDraft(emptyDraft);
    setStatus("Flow saved.");
  }

  async function deleteFlow(id: string) {
    const response = await fetch(`/api/dashboard/flows/${id}`, { method: "DELETE" });
    if (response.ok) {
      setFlows((current) => current.filter((flow) => flow.id !== id));
      setStatus("Flow deleted.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Ingested Flows</h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep reusable step-by-step support flows ready for the voice agent.
          </p>
        </div>
        <Button onClick={openCreate}>Add Flow</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">App</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedFlows.map((flow) => (
              <tr key={flow.id} className="border-t border-slate-100">
                <td className="px-4 py-4 font-medium text-slate-900">{flow.name}</td>
                <td className="px-4 py-4 text-slate-600">{flow.app}</td>
                <td className="px-4 py-4 text-slate-600">{flow.description}</td>
                <td className="px-4 py-4 text-slate-500">
                  {flow.caretaker_id ? "Custom" : "Global"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    {flow.caretaker_id ? (
                      <>
                        <Button variant="outline" onClick={() => openEdit(flow)}>
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => void deleteFlow(flow.id)}>
                          Delete
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Read only</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {status ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {status}
        </p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <Card className="w-full max-w-3xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingFlowId ? "Edit Flow" : "Add Flow"}
              </h2>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
            <form onSubmit={saveFlow} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Name"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
                <Input
                  label="App"
                  value={draft.app}
                  onChange={(event) => setDraft({ ...draft, app: event.target.value })}
                />
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Steps JSON</span>
                <textarea
                  value={draft.stepsText}
                  onChange={(event) => setDraft({ ...draft, stepsText: event.target.value })}
                  rows={14}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-3 font-mono text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingFlowId ? "Update Flow" : "Create Flow"}</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
