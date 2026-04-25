import { requireAuthenticatedCaretaker } from "@/app/api/dashboard/_lib/auth";
import { FlowsManager } from "@/components/dashboard/FlowsManager";

export default async function FlowsPage() {
  const { supabase, caretaker } = await requireAuthenticatedCaretaker();
  const { data: flows } = await supabase
    .from("ingested_flows")
    .select("*")
    .or(`caretaker_id.eq.${caretaker.id},caretaker_id.is.null`)
    .order("created_at", { ascending: false });

  return (
    <FlowsManager initialFlows={flows ?? []} />
  );
}
