"use client";

import { useState, useMemo } from "react";
import type { PatientRow } from "@/utils/admin-types";
import { formatBilingualPatient, formatBilingualChw, Language } from "@/utils/translations";

type PatientsRegistryClientProps = {
  patients: PatientRow[];
  lang: Language;
  t: any;
};

export function PatientsRegistryClient({ patients, lang, t }: PatientsRegistryClientProps) {
  const [selectedRisk, setSelectedRisk] = useState<"ALL" | "HIGH" | "MODERATE" | "LOW">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Local helper for localized numbers
  const toLocalNum = (num: number) => {
    if (lang === "bn") {
      const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      return num
        .toString()
        .split("")
        .map((c) => bnNums[parseInt(c)] || c)
        .join("");
    }
    return num.toString();
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // 1. Risk Filter
      if (selectedRisk !== "ALL" && p.last_risk_level !== selectedRisk) {
        return false;
      }
      // 2. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const bilingualName = formatBilingualPatient(p.name).toLowerCase();
      const chwBilingual = formatBilingualChw(p.chw_id).toLowerCase();

      return (
        bilingualName.includes(q) ||
        p.chw_id.toLowerCase().includes(q) ||
        chwBilingual.includes(q) ||
        (p.last_risk_level || "").toLowerCase().includes(q)
      );
    });
  }, [patients, selectedRisk, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-surface p-4 rounded-xl border border-outline-variant shadow-sm">
        {/* Search Input matching mobile styling */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === "bn" ? "নাম, ইউনিয়ন, উপজেলা দিয়ে খুঁজুন..." : "Search name, union, upazila..."
            }
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder-on-surface-variant/60"
          />
        </div>

        {/* Risk Filtering Pills */}
        <div className="flex flex-wrap items-center gap-2" aria-label="Filter by risk level">
          <button
            onClick={() => setSelectedRisk("ALL")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-label-sm text-xs font-bold transition-all border cursor-pointer ${
              selectedRisk === "ALL"
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">checklist</span>
            {t.all_risks}
          </button>

          <button
            onClick={() => setSelectedRisk("HIGH")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-label-sm text-xs font-bold transition-all border cursor-pointer ${
              selectedRisk === "HIGH"
                ? "bg-error text-on-error border-error"
                : "bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">warning</span>
            {t.risk_high}
          </button>

          <button
            onClick={() => setSelectedRisk("MODERATE")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-label-sm text-xs font-bold transition-all border cursor-pointer ${
              selectedRisk === "MODERATE"
                ? "bg-secondary-container text-on-secondary-container border-secondary-container"
                : "bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">emergency</span>
            {t.risk_moderate}
          </button>

          <button
            onClick={() => setSelectedRisk("LOW")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-label-sm text-xs font-bold transition-all border cursor-pointer ${
              selectedRisk === "LOW"
                ? "bg-primary-container text-on-primary-container border-primary-container"
                : "bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            {t.risk_low}
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-headline-md text-[18px] font-bold text-on-surface">
            {lang === "bn" ? "নিবন্ধিত মায়েদের তালিকা" : "Tracked Mothers"}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-3.5 font-medium">{t.col_mother}</th>
                <th className="px-6 py-3.5 font-medium">{t.col_age}</th>
                <th className="px-6 py-3.5 font-medium">{t.col_weeks}</th>
                <th className="px-6 py-3.5 font-medium">{t.col_chw}</th>
                <th className="px-6 py-3.5 font-medium">{t.col_risk}</th>
                <th className="px-6 py-3.5 font-medium text-right">{t.col_updated}</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant bg-surface">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center font-bold text-on-surface-variant">
                    {t.empty_patients}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((row, index) => {
                  return (
                    <tr
                      key={row.id || index}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="whitespace-nowrap px-6 py-3.5 font-bold text-on-surface">
                        {formatBilingualPatient(row.name)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-on-surface-variant font-bold tabular-nums">
                        {toLocalNum(row.age)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-on-surface-variant font-bold tabular-nums">
                        {toLocalNum(row.gestational_age_weeks)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-on-surface font-semibold">
                        {formatBilingualChw(row.chw_id)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5">
                        {row.last_risk_level === "HIGH" ? (
                          <span className="inline-flex items-center gap-1 bg-error text-on-error px-2.5 py-0.5 rounded-full text-xs font-bold border border-error">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            {lang === "bn" ? "উচ্চ" : "HIGH"}
                          </span>
                        ) : row.last_risk_level === "MODERATE" ? (
                          <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-xs font-bold border border-secondary-container">
                            <span className="material-symbols-outlined text-[12px]">emergency</span>
                            {lang === "bn" ? "মাঝারি" : "MODERATE"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded-full text-xs font-bold border border-primary-container">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            {lang === "bn" ? "নিম্ন" : "LOW"}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-right text-on-surface-variant/80 text-xs font-semibold font-label-sm">
                        {new Date(row.updated_at).toLocaleString(
                          lang === "bn" ? "bn-BD" : "en-US",
                          { dateStyle: "medium", timeStyle: "short" }
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
