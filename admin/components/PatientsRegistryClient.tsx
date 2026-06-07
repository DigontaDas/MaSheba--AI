"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MotherRegistryRow, RiskLevel, ChwRow } from "@/utils/admin-types";
import type { Language } from "@/utils/translations";
import { AssignChwModal } from "@/components/AssignChwModal";

type RiskFilter = "ALL" | RiskLevel | "UNASSESSED";

type PatientsRegistryClientProps = {
  patients: MotherRegistryRow[];
  chws: ChwRow[];
  lang: Language;
  t: any;
};

const riskStyles: Record<RiskLevel, string> = {
  HIGH: "bg-error text-on-error border-error",
  MODERATE: "bg-secondary-container text-on-secondary-container border-secondary-container",
  LOW: "bg-primary-container text-on-primary-container border-primary-container",
};

const statusStyles: Record<MotherRegistryRow["verification_status"], string> = {
  VERIFIED: "bg-primary-container text-on-primary-container border-primary-container",
  PENDING: "bg-secondary-container text-on-secondary-container border-secondary-container",
  REJECTED: "bg-error-container text-on-error-container border-error-container",
};

export function PatientsRegistryClient({ patients, chws, t }: PatientsRegistryClientProps) {
  const router = useRouter();
  const [patientList, setPatientList] = useState(patients);
  const [prevPatients, setPrevPatients] = useState(patients);
  const [selectedRisk, setSelectedRisk] = useState<RiskFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetMother, setTargetMother] = useState<MotherRegistryRow | null>(null);

  if (patients !== prevPatients) {
    setPatientList(patients);
    setPrevPatients(patients);
  }

  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return patientList.filter((mother) => {
      if (selectedRisk === "UNASSESSED" && mother.last_risk_level) return false;
      if (selectedRisk !== "ALL" && selectedRisk !== "UNASSESSED" && mother.last_risk_level !== selectedRisk) return false;
      if (!q) return true;

      return [
        mother.name,
        mother.phone,
        mother.verification_status,
        mother.patient_id,
        mother.chw_id,
        mother.chw_name,
        mother.link_status,
        mother.last_risk_level ?? "Not assessed",
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [patientList, searchQuery, selectedRisk]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-surface p-4 rounded-xl border border-outline-variant shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, CHW, status..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2" aria-label="Filter by risk level">
          <RiskButton active={selectedRisk === "ALL"} label={t.all_risks} icon="checklist" onClick={() => setSelectedRisk("ALL")} />
          <RiskButton active={selectedRisk === "HIGH"} label={t.risk_high} icon="warning" tone="HIGH" onClick={() => setSelectedRisk("HIGH")} />
          <RiskButton active={selectedRisk === "MODERATE"} label={t.risk_moderate} icon="emergency" tone="MODERATE" onClick={() => setSelectedRisk("MODERATE")} />
          <RiskButton active={selectedRisk === "LOW"} label={t.risk_low} icon="check_circle" tone="LOW" onClick={() => setSelectedRisk("LOW")} />
          <RiskButton active={selectedRisk === "UNASSESSED"} label="Unassessed" icon="help" onClick={() => setSelectedRisk("UNASSESSED")} />
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-headline-md text-[18px] font-bold text-on-surface">Tracked Mothers</h3>
          <span className="text-xs font-bold text-on-surface-variant">{filteredPatients.length} shown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-3.5 font-medium">{t.col_mother}</th>
                <th className="px-6 py-3.5 font-medium">Phone</th>
                <th className="px-6 py-3.5 font-medium">{t.col_status}</th>
                <th className="px-6 py-3.5 font-medium">{t.col_chw}</th>
                <th className="px-6 py-3.5 font-medium">{t.col_weeks}</th>
                <th className="px-6 py-3.5 font-medium">{t.col_risk}</th>
                <th className="px-6 py-3.5 font-medium">Actions</th>
                <th className="px-6 py-3.5 font-medium text-right">{t.col_updated}</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant bg-surface">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center font-bold text-on-surface-variant">
                    {t.empty_patients}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => {
                      setTargetMother(row);
                      setAssignModalOpen(true);
                    }}
                    className="hover:bg-surface-container-low/60 transition-colors cursor-pointer"
                  >
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <div className="font-bold text-on-surface">{row.name}</div>
                      <div className="text-[11px] font-semibold text-on-surface-variant">{row.patient_id ? `Patient ${row.patient_id}` : "No patient record yet"}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-on-surface-variant font-semibold">{row.phone || "Not provided"}</td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <Badge className={statusStyles[row.verification_status] || "bg-surface-container-low text-on-surface-variant border-outline-variant"} label={row.verification_status || "Unknown"} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      {row.link_status === "LINKED" ? (
                        <div>
                          <div className="font-semibold text-on-surface">{row.chw_name || row.chw_id || "Linked CHW"}</div>
                          <div className="text-[11px] font-semibold text-primary">Linked</div>
                        </div>
                      ) : (
                        <Badge className="bg-surface-container-low text-on-surface-variant border-outline-variant" label="Not linked" />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-on-surface-variant font-bold tabular-nums">
                      {row.gestational_age_weeks ?? "Not set"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      {row.last_risk_level ? (
                        <Badge className={riskStyles[row.last_risk_level]} label={row.last_risk_level} />
                      ) : (
                        <Badge className="bg-surface-container-low text-on-surface-variant border-outline-variant" label="Not assessed" />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetMother(row);
                          setAssignModalOpen(true);
                        }}
                        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
                          row.link_status === "LINKED"
                            ? "bg-surface text-on-surface border-outline hover:bg-surface-container-high"
                            : "bg-primary text-on-primary border-primary hover:bg-surface-tint"
                        }`}
                      >
                        {row.link_status === "LINKED" ? "Reassign" : "Assign CHW"}
                      </button>
                    </td>
                    <td suppressHydrationWarning className="whitespace-nowrap px-6 py-3.5 text-right text-on-surface-variant/80 text-xs font-semibold font-label-sm">
                      {new Date(row.updated_at || row.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {targetMother && (
        <AssignChwModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setTargetMother(null);
          }}
          mother={targetMother}
          chws={chws}
          onSuccess={(updatedRow) => {
            setPatientList((prev) =>
              prev.map((p) => (p.id === updatedRow.id ? updatedRow : p))
            );
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Badge({ className, label }: { className: string; label: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${className}`}>{label}</span>;
}

function RiskButton({
  active,
  icon,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
  tone?: RiskLevel;
}) {
  const activeClass = tone ? riskStyles[tone] : "bg-primary text-on-primary border-primary";
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-label-sm text-xs font-bold transition-all border cursor-pointer ${
        active ? activeClass : "bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:bg-surface-container-high"
      }`}
      type="button"
    >
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
    </button>
  );
}
