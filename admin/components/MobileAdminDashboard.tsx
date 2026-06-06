"use client";

import { useMemo, useState } from "react";
import type { ChwRow, PatientRow, RiskLevel, SummaryPayload } from "@/utils/admin-types";
import type { Language } from "@/utils/translations";

type Props = {
  language: Language;
  patients: PatientRow[];
  summary: SummaryPayload;
};

type TabKey = "chws" | "patients";
type RiskFilter = "ALL" | RiskLevel;

const copy = {
  en: {
    title: "Admin Panel",
    subtitle: "MaaSheba AI operations dashboard",
    sync: "Database sync active",
    activeChws: "Active health workers",
    trackedPatients: "Registered pregnant mothers",
    highRiskPatients: "High risk mothers",
    riskTitle: "Risk level analysis",
    low: "Low risk",
    moderate: "Moderate risk",
    high: "High risk",
    chws: "Health workers",
    patients: "Pregnant mothers",
    search: "Search by name or area...",
    allRisks: "All risk",
    clearFilter: "Clear CHW filter",
    name: "Name",
    union: "Union",
    upazila: "Upazila",
    patientCount: "Patients",
    age: "Age",
    weeks: "Weeks",
    risk: "Risk",
    assignedChw: "Health worker",
    years: "years",
    filterPatients: "Filter patient list",
    noRows: "No records found.",
    details: "Details",
    active: "Active",
    inactive: "Inactive",
  },
  bn: {
    title: "অ্যাডমিন প্যানেল",
    subtitle: "মাশেবা AI পরিচালনা ড্যাশবোর্ড",
    sync: "ডাটাবেস সিঙ্ক সক্রিয়",
    activeChws: "সক্রিয় স্বাস্থ্যকর্মী",
    trackedPatients: "নিবন্ধিত গর্ভবতী মা",
    highRiskPatients: "উচ্চ ঝুঁকিপূর্ণ মা",
    riskTitle: "ঝুঁকির মাত্রা অনুযায়ী বিশ্লেষণ",
    low: "কম ঝুঁকি",
    moderate: "মাঝারি ঝুঁকি",
    high: "উচ্চ ঝুঁকি",
    chws: "স্বাস্থ্যকর্মী",
    patients: "গর্ভবতী মা",
    search: "নাম বা এলাকা দিয়ে খুঁজুন...",
    allRisks: "সব ঝুঁকি",
    clearFilter: "CHW ফিল্টার মুছুন",
    name: "নাম",
    union: "ইউনিয়ন",
    upazila: "উপজেলা",
    patientCount: "রোগী সংখ্যা",
    age: "বয়স",
    weeks: "সপ্তাহ",
    risk: "ঝুঁকি",
    assignedChw: "স্বাস্থ্যকর্মী",
    years: "বছর",
    filterPatients: "রোগী তালিকা ফিল্টার করুন",
    noRows: "কোনো তথ্য পাওয়া যায়নি।",
    details: "বিস্তারিত বিবরণ",
    active: "সক্রিয়",
    inactive: "নিষ্ক্রিয়",
  },
};

const riskStyles: Record<RiskLevel, { bg: string; text: string; bar: string }> = {
  LOW: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  MODERATE: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  HIGH: { bg: "bg-rose-50", text: "text-rose-700", bar: "bg-rose-500" },
};

export function MobileAdminDashboard({ language, patients, summary }: Props) {
  const t = copy[language] ?? copy.en;
  const [activeTab, setActiveTab] = useState<TabKey>("chws");
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [selectedChwFilter, setSelectedChwFilter] = useState<ChwRow | null>(null);
  const [selectedChw, setSelectedChw] = useState<ChwRow | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);

  const riskTotals = useMemo(
    () =>
      summary.risk_summary.reduce(
        (acc, row) => ({
          LOW: acc.LOW + (row.low_count ?? 0),
          MODERATE: acc.MODERATE + (row.moderate_count ?? 0),
          HIGH: acc.HIGH + (row.high_count ?? 0),
        }),
        { LOW: 0, MODERATE: 0, HIGH: 0 },
      ),
    [summary.risk_summary],
  );

  const chwsById = useMemo(() => new Map(summary.chws.map((chw) => [chw.chw_id, chw])), [summary.chws]);
  const query = searchQuery.trim().toLowerCase();

  const filteredChws = useMemo(
    () =>
      summary.chws.filter((chw) =>
        [chw.name, chw.union_name, chw.upazila].some((value) => value.toLowerCase().includes(query)),
      ),
    [query, summary.chws],
  );

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        const chw = patient.chw_id ? chwsById.get(patient.chw_id) : null;
        const matchesQuery = [patient.name, chw?.name, chw?.union_name, chw?.upazila]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
        const matchesRisk = riskFilter === "ALL" || patient.last_risk_level === riskFilter;
        const matchesChw = !selectedChwFilter || patient.chw_id === selectedChwFilter.chw_id;
        return matchesQuery && matchesRisk && matchesChw;
      }),
    [chwsById, patients, query, riskFilter, selectedChwFilter],
  );

  return (
    <div className="min-h-full bg-[#f8fbfa] text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="rounded-2xl border border-brand-accent/15 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.title}</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">{t.subtitle}</p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {t.sync}
            </span>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <StatCard icon={<span className="text-sm font-black">CHW</span>} label={t.activeChws} value={summary.metrics.active_chws} tone="emerald" />
          <StatCard icon={<span className="text-sm font-black">M</span>} label={t.trackedPatients} value={summary.metrics.tracked_patients} tone="sky" />
          <StatCard icon={<span className="text-sm font-black">!</span>} label={t.highRiskPatients} value={summary.metrics.high_risk_patients} tone="rose" />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-800">{t.riskTitle}</h2>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <RiskLegend label={t.low} risk="LOW" count={riskTotals.LOW} />
              <RiskLegend label={t.moderate} risk="MODERATE" count={riskTotals.MODERATE} />
              <RiskLegend label={t.high} risk="HIGH" count={riskTotals.HIGH} />
            </div>
          </div>
          <SegmentedRiskBar totals={riskTotals} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="relative h-4 w-4 shrink-0 rounded-full border-2 border-slate-400 after:absolute after:-bottom-1 after:-right-1 after:h-2 after:w-0.5 after:rotate-[-45deg] after:rounded-full after:bg-slate-400" />
              <input
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                placeholder={t.search}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            {selectedChwFilter ? (
              <button
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-cream px-3 py-1.5 text-xs font-bold text-brand-accent"
                onClick={() => setSelectedChwFilter(null)}
                type="button"
              >
                <span className="text-xs font-black">x</span>
                {t.clearFilter}: {selectedChwFilter.name}
              </button>
            ) : null}

            <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <TabButton active={activeTab === "chws"} label={t.chws} onClick={() => setActiveTab("chws")} />
              <TabButton active={activeTab === "patients"} label={t.patients} onClick={() => setActiveTab("patients")} />
            </div>

            {activeTab === "patients" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <RiskPill active={riskFilter === "ALL"} label={t.allRisks} onClick={() => setRiskFilter("ALL")} />
                <RiskPill active={riskFilter === "HIGH"} label={t.high} risk="HIGH" onClick={() => setRiskFilter("HIGH")} />
                <RiskPill active={riskFilter === "MODERATE"} label={t.moderate} risk="MODERATE" onClick={() => setRiskFilter("MODERATE")} />
                <RiskPill active={riskFilter === "LOW"} label={t.low} risk="LOW" onClick={() => setRiskFilter("LOW")} />
              </div>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            {activeTab === "chws" ? (
              <ChwTable chws={filteredChws} t={t} onSelect={setSelectedChw} />
            ) : (
              <PatientTable patients={filteredPatients} chwsById={chwsById} t={t} onSelect={setSelectedPatient} />
            )}
          </div>
        </section>
      </div>

      {selectedChw ? (
        <DetailModal title={t.details} onClose={() => setSelectedChw(null)}>
          <DetailRow label={t.name} value={selectedChw.name} />
          <DetailRow label={t.union} value={selectedChw.union_name} />
          <DetailRow label={t.upazila} value={selectedChw.upazila} />
          <DetailRow label={t.patientCount} value={selectedChw.patient_count.toString()} />
          <DetailRow label="Status" value={selectedChw.is_active ? t.active : t.inactive} />
          <button
            className="mt-4 w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-bold text-white"
            onClick={() => {
              setSelectedChwFilter(selectedChw);
              setSelectedChw(null);
              setActiveTab("patients");
            }}
            type="button"
          >
            {t.filterPatients}
          </button>
        </DetailModal>
      ) : null}

      {selectedPatient ? (
        <DetailModal title={t.details} onClose={() => setSelectedPatient(null)}>
          <DetailRow label={t.name} value={selectedPatient.name} />
          <DetailRow label={t.age} value={selectedPatient.age == null ? "Not set" : `${selectedPatient.age} ${t.years}`} />
          <DetailRow label={t.weeks} value={selectedPatient.gestational_age_weeks == null ? "Not set" : selectedPatient.gestational_age_weeks.toString()} />
          <DetailRow label={t.risk} value={riskLabel(selectedPatient.last_risk_level, t)} />
          <DetailRow label={t.assignedChw} value={selectedPatient.chw_id ? chwsById.get(selectedPatient.chw_id)?.name ?? selectedPatient.chw_id : "Not linked"} />
        </DetailModal>
      ) : null}
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "emerald" | "sky" | "rose" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</div>
      <div className="text-3xl font-black tabular-nums text-slate-900">{value}</div>
      <div className="mt-1 text-sm font-bold text-slate-500">{label}</div>
    </div>
  );
}

function SegmentedRiskBar({ totals }: { totals: Record<RiskLevel, number> }) {
  const total = Math.max(totals.LOW + totals.MODERATE + totals.HIGH, 1);
  return (
    <div className="flex h-5 overflow-hidden rounded-full bg-slate-100">
      {(["LOW", "MODERATE", "HIGH"] as RiskLevel[]).map((risk) => (
        <div
          className={`${riskStyles[risk].bar} transition-all`}
          key={risk}
          style={{ width: `${(totals[risk] / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

function RiskLegend({ label, risk, count }: { label: string; risk: RiskLevel; count: number }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${riskStyles[risk].bg} ${riskStyles[risk].text}`}>
      <span className={`h-2 w-2 rounded-full ${riskStyles[risk].bar}`} />
      {label}: {count}
    </span>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`rounded-lg px-3 py-2 text-sm font-bold transition ${active ? "bg-white text-brand-accent shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function RiskPill({ active, label, onClick, risk }: { active: boolean; label: string; onClick: () => void; risk?: RiskLevel }) {
  const activeClass = risk ? `${riskStyles[risk].bg} ${riskStyles[risk].text}` : "bg-brand-cream text-brand-accent";
  return (
    <button
      className={`rounded-full border px-3 py-1.5 text-xs font-bold ${active ? `${activeClass} border-transparent` : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ChwTable({ chws, t, onSelect }: { chws: ChwRow[]; t: typeof copy.en; onSelect: (chw: ChwRow) => void }) {
  if (!chws.length) return <EmptyState label={t.noRows} />;
  return (
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
        <tr>
          <th className="px-4 py-3">{t.name}</th>
          <th className="px-4 py-3">{t.union}</th>
          <th className="px-4 py-3">{t.upazila}</th>
          <th className="px-4 py-3 text-right">{t.patientCount}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {chws.map((chw) => (
          <tr className="cursor-pointer hover:bg-brand-cream/20" key={chw.chw_id} onClick={() => onSelect(chw)}>
            <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-800">{chw.name}</td>
            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-500">{chw.union_name}</td>
            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-500">{chw.upazila}</td>
            <td className="whitespace-nowrap px-4 py-3 text-right font-black text-brand-accent">{chw.patient_count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PatientTable({
  patients,
  chwsById,
  t,
  onSelect,
}: {
  patients: PatientRow[];
  chwsById: Map<string, ChwRow>;
  t: typeof copy.en;
  onSelect: (patient: PatientRow) => void;
}) {
  if (!patients.length) return <EmptyState label={t.noRows} />;
  return (
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
        <tr>
          <th className="px-4 py-3">{t.name}</th>
          <th className="px-4 py-3">{t.age}</th>
          <th className="px-4 py-3">{t.weeks}</th>
          <th className="px-4 py-3">{t.risk}</th>
          <th className="px-4 py-3">{t.assignedChw}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {patients.map((patient) => (
          <tr className="cursor-pointer hover:bg-brand-cream/20" key={patient.id} onClick={() => onSelect(patient)}>
            <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-800">{patient.name}</td>
            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-500">{patient.age ?? "Not set"}</td>
            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-500">{patient.gestational_age_weeks ?? "Not set"}</td>
            <td className="whitespace-nowrap px-4 py-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${patient.last_risk_level ? `${riskStyles[patient.last_risk_level].bg} ${riskStyles[patient.last_risk_level].text}` : "bg-slate-100 text-slate-500"}`}>
                {riskLabel(patient.last_risk_level, t)}
              </span>
            </td>
            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-500">{patient.chw_id ? chwsById.get(patient.chw_id)?.name ?? patient.chw_id : "Not linked"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DetailModal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">{title}</h2>
          <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">
            <span className="text-base font-black">x</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="px-4 py-10 text-center text-sm font-bold text-slate-400">{label}</div>;
}

function riskLabel(risk: RiskLevel | null, t: typeof copy.en) {
  if (!risk) return "Not assessed";
  if (risk === "HIGH") return t.high;
  if (risk === "MODERATE") return t.moderate;
  return t.low;
}
