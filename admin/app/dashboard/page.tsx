import { RiskSummaryChart } from "@/components/RiskSummaryChart";
import { UpazilaRiskMap } from "@/components/UpazilaRiskMap";
import { getSummary } from "@/utils/admin-api";
import { getTranslation } from "@/utils/translations";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getSummary();
  const t = getTranslation();

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-background">
          Regional Overview: Narsingdi District
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          {t.overview_subtitle}
        </p>
      </div>

      {/* 1. Summary Metric Cards (Bento Style Row) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter" aria-label="Key Metrics">
        {/* Card 1: Total Patients */}
        <div className="bg-surface rounded-xl p-card-padding border border-outline-variant flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary-container transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container/5 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              {t.tracked_patients}
            </h3>
            <span className="material-symbols-outlined text-primary" data-weight="fill">
              groups
            </span>
          </div>
          <div>
            <p className="font-headline-lg text-headline-lg text-on-surface tabular-nums">
              {summary.metrics.tracked_patients}
            </p>
            <p className="font-label-sm text-label-sm text-primary flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              Live Triage
            </p>
          </div>
        </div>

        {/* Card 2: High-Risk Alerts */}
        <div className="bg-surface rounded-xl p-card-padding border border-outline-variant flex flex-col justify-between h-32 relative overflow-hidden group hover:border-error transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-error-container/10 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              {t.high_risk_patients}
            </h3>
            <span className="material-symbols-outlined text-error" data-weight="fill">
              warning
            </span>
          </div>
          <div>
            <p className="font-headline-lg text-headline-lg text-error tabular-nums">
              {summary.metrics.high_risk_patients}
            </p>
            <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">priority_high</span>
              Review Required
            </p>
          </div>
        </div>

        {/* Card 3: Active CHWs */}
        <div className="bg-surface rounded-xl p-card-padding border border-outline-variant flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary-container transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary-fixed/20 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              {t.active_chws}
            </h3>
            <span className="material-symbols-outlined text-tertiary" data-weight="fill">
              medical_services
            </span>
          </div>
          <div>
            <p className="font-headline-lg text-headline-lg text-on-surface tabular-nums">
              {summary.metrics.active_chws}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
              Active Field Staff
            </p>
          </div>
        </div>

        {/* Card 4: Active Upazilas (Coverage) */}
        <div className="bg-surface rounded-xl p-card-padding border border-outline-variant flex flex-col justify-between h-32 relative overflow-hidden group hover:border-secondary-container transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary-fixed/20 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Coverage Area
            </h3>
            <span className="material-symbols-outlined text-secondary" data-weight="fill">
              location_on
            </span>
          </div>
          <div>
            <p className="font-headline-lg text-headline-lg text-on-surface tabular-nums">
              {summary.heatmap.length}
            </p>
            <p className="font-label-sm text-label-sm text-secondary flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">explore</span>
              Upazila Units
            </p>
          </div>
        </div>
      </section>

      {/* 2. Bento Grid Layout: Map & Trend Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Spans 2 Columns */}
        <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">location_on</span>
              {t.static_upazila_risk}
            </h3>
          </div>
          <div className="p-4 bg-surface-container-low/30">
            <UpazilaRiskMap rows={summary.heatmap} />
          </div>
        </div>

        {/* Distribution Chart Spans 1 Column */}
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              {t.patient_count_by_risk}
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center p-2 bg-surface">
            {summary.risk_summary.length ? (
              <RiskSummaryChart data={summary.risk_summary} />
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant p-6 text-center">
                No risk summary data found.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 3. Bottom Section: Active Personnel Coverage Table */}
      <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm" aria-labelledby="chw-list-heading">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <h3 id="chw-list-heading" className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">assignment_ind</span>
            {t.chw_list}
          </h3>
        </div>

        {summary.chws.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-3.5 font-medium">{t.col_name}</th>
                  <th className="px-6 py-3.5 font-medium">{t.col_union}</th>
                  <th className="px-6 py-3.5 font-medium">{t.col_upazila}</th>
                  <th className="px-6 py-3.5 font-medium text-right">{t.col_patients}</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant">
                {summary.chws.map((chw) => (
                  <tr key={chw.chw_id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-3.5 font-bold text-on-surface">
                      {chw.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-on-surface-variant">
                      {chw.union_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-on-surface-variant">
                      {chw.upazila}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right font-bold text-primary tabular-nums">
                      {chw.patient_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-12 text-center font-bold text-on-surface-variant">
            {t.empty_chws}
          </p>
        )}
      </section>
    </div>
  );
}
