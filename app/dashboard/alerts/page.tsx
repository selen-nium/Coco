import { requireAuthenticatedCaretaker } from "@/app/api/dashboard/_lib/auth";
import { AlertsList } from "@/components/dashboard/AlertsList";

type AlertRecord = {
  id: string;
  detected_keywords: string[];
  severity: "high" | "critical";
  created_at: string;
  elderly_user: { name: string; phone: string };
};

export default async function AlertsPage() {
  const { supabase, caretaker } = await requireAuthenticatedCaretaker();
  const { data: elderlyUsers } = await supabase
    .from("elderly_users")
    .select("id")
    .eq("caretaker_id", caretaker.id);

  const elderlyIds = (elderlyUsers ?? []).map((user) => user.id);
  const { data: alerts } =
    elderlyIds.length > 0
      ? await supabase
          .from("scam_alerts")
          .select(
            `
              id,
              detected_keywords,
              severity,
              created_at,
              elderly_user:elderly_users!scam_alerts_elderly_user_id_fkey(name, phone)
            `
          )
          .in("elderly_user_id", elderlyIds)
          .eq("status", "active")
          .order("created_at", { ascending: false })
      : { data: [] };

  const initialAlerts: AlertRecord[] = (alerts ?? [])
    .map((alert) => {
      const elderlyUser = Array.isArray(alert.elderly_user)
        ? alert.elderly_user[0]
        : undefined;

      return {
        id: alert.id,
        detected_keywords: alert.detected_keywords,
        severity: alert.severity,
        created_at: alert.created_at,
        elderly_user: {
          name: elderlyUser?.name ?? "Unknown",
          phone: elderlyUser?.phone ?? "",
        },
      };
    })
    .filter((alert) => Boolean(alert.elderly_user.phone || alert.elderly_user.name));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-rose-700">Alerts</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Active scam alerts</h1>
      </div>
      <AlertsList initialAlerts={initialAlerts} />
    </div>
  );
}
