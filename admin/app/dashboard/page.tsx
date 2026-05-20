import { RiskSummaryChart } from "@/components/RiskSummaryChart";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type ChwListRow = {
  chw_id: string;
  name: string;
  union_name: string;
  upazila: string;
  is_active: boolean;
  patient_count: number;
};

type RiskSummaryRow = {
  chw_id: string;
  chw_name: string;
  low_count: number;
  moderate_count: number;
  high_count: number;
};

async function getDashboardData() {
  const supabase = createAdminClient();
  const [chwResponse, riskResponse] = await Promise.all([
    supabase.from("v_chw_list").select("chw_id,name,union_name,upazila,is_active,patient_count"),
    supabase.from("v_risk_summary").select("chw_id,chw_name,low_count,moderate_count,high_count"),
  ]);

  if (chwResponse.error) {
    throw new Error("Unable to load CHW list.");
  }
  if (riskResponse.error) {
    throw new Error("Unable to load risk summary.");
  }

  return {
    chws: (chwResponse.data ?? []) as ChwListRow[],
    riskSummary: (riskResponse.data ?? []) as RiskSummaryRow[],
  };
}

export default async function DashboardPage() {
  const { chws, riskSummary } = await getDashboardData();
  const totalPatients = chws.reduce((sum, chw) => sum + chw.patient_count, 0);
  const activeChws = chws.filter((chw) => chw.is_active).length;
  const highRiskTotal = riskSummary.reduce((sum, row) => sum + row.high_count, 0);

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Active CHWs" value={activeChws} />
        <Metric label="Tracked Patients" value={totalPatients} />
        <Metric label="High Risk Patients" value={highRiskTotal} tone="risk" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
        <div className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-base font-semibold text-slate-950">CHW List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-normal text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Union</th>
                  <th className="px-4 py-3">Upazila</th>
                  <th className="px-4 py-3 text-right">Patients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chws.map((chw) => (
                  <tr key={chw.chw_id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">
                      {chw.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{chw.union_name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{chw.upazila}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-950">
                      {chw.patient_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-base font-semibold text-slate-950">Patient Count by Risk Level</h2>
          </div>
          <RiskSummaryChart data={riskSummary} />
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "risk";
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
      <p className="text-sm text-slate-600">{label}</p>
      <p className={tone === "risk" ? "mt-1 text-2xl font-semibold text-rose-700" : "mt-1 text-2xl font-semibold text-slate-950"}>
        {value}
      </p>
    </div>
  );
}
