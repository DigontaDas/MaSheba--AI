"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ChwRow } from "@/utils/admin-types";
import { formatBilingualChw, getTranslation, type Language } from "@/utils/translations";

type Translation = ReturnType<typeof getTranslation>;

export function ChwDirectoryClient({
  chws,
  lang,
  t,
}: {
  chws: ChwRow[];
  lang: Language;
  t: Translation;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [selectedChwId, setSelectedChwId] = useState<string>(
    chws.length > 0 ? chws[0].chw_id : ""
  );

  const toLocalNum = (num: number) => {
    if (lang !== "bn") return num.toString();
    const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num
      .toString()
      .split("")
      .map((char) => bnNums[Number.parseInt(char, 10)] || char)
      .join("");
  };

  // Filter CHWs based on search query
  const filteredChws = chws.filter((chw) => {
    const term = query.toLowerCase().trim();
    if (!term) return true;
    return (
      chw.name.toLowerCase().includes(term) ||
      chw.chw_id.toLowerCase().includes(term) ||
      chw.union_name.toLowerCase().includes(term) ||
      chw.upazila.toLowerCase().includes(term)
    );
  });

  // Find currently selected CHW
  const selectedChw = chws.find((c) => c.chw_id === selectedChwId) || chws[0];

  // Access toggles (client-side state)
  const [clinicalAccess, setClinicalAccess] = useState(true);
  const [referralAuth, setReferralAuth] = useState(true);
  const [offlineExport, setOfflineExport] = useState(false);

  // Status toggle handler
  function handleToggleStatus(chwId: string, isActive: boolean) {
    startTransition(async () => {
      await fetch(`/dashboard/chws/status`, {
        method: "POST",
        body: JSON.stringify({ chwId, isActive: !isActive }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Metric Cards Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-gutter" aria-label="Lifecycle Metrics">
        <div className="bg-surface p-card-padding rounded-xl border border-outline-variant flex flex-col justify-between h-24 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[20px]" data-weight="fill">
              groups
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              {lang === "bn" ? "সক্রিয় স্বাস্থ্যকর্মী" : "Active Staff"}
            </span>
          </div>
          <span className="font-headline-lg text-headline-lg text-on-surface tabular-nums">
            {chws.filter((c) => c.is_active).length}
          </span>
        </div>

        <div className="bg-surface p-card-padding rounded-xl border border-outline-variant flex flex-col justify-between h-24 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-secondary text-[20px]">
              pending_actions
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              {lang === "bn" ? "নিষ্ক্রিয় কর্মী" : "Inactive Staff"}
            </span>
          </div>
          <span className="font-headline-lg text-headline-lg text-on-surface tabular-nums">
            {chws.filter((c) => !c.is_active).length}
          </span>
        </div>

        <div className="bg-surface p-card-padding rounded-xl border border-outline-variant flex flex-col justify-between h-24 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-error text-[20px]" data-weight="fill">
              gpp_maybe
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              {lang === "bn" ? "এমএফএ অ্যালার্ট" : "MFA Alerts"}
            </span>
          </div>
          <span className="font-headline-lg text-headline-lg text-error">1</span>
        </div>

        <div className="bg-surface p-card-padding rounded-xl border border-outline-variant flex flex-col justify-between h-24 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[20px]">
              cloud_sync
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              {lang === "bn" ? "সিঙ্ক সমস্যা" : "Sync Issues"}
            </span>
          </div>
          <span className="font-headline-lg text-headline-lg text-on-surface">0</span>
        </div>
      </section>

      {/* Main Layout: Table and Sidebar */}
      <div className="flex flex-col lg:flex-row gap-gutter">
        {/* Data Table Section */}
        <div className="flex-1 bg-surface rounded-xl border border-outline-variant overflow-hidden flex flex-col min-h-[500px] shadow-sm">
          <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex flex-wrap justify-between items-center gap-3">
            <h3 className="font-headline-md text-[18px] font-bold text-on-surface">
              {lang === "bn" ? "নিবন্ধিত স্বাস্থ্যকর্মী কর্মীদল" : "Registered Personnel"}
            </h3>
            {/* Search inputs */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-full font-body-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-on-surface"
                placeholder={t.search_records}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.col_name}</th>
                  <th className="px-4 py-3 font-medium">{t.col_union}</th>
                  <th className="px-4 py-3 font-medium">{t.col_status}</th>
                  <th className="px-4 py-3 font-medium text-right">{t.col_patients}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant font-body-md text-body-md text-on-surface bg-surface">
                {filteredChws.map((row) => {
                  const isRowSelected = selectedChwId === row.chw_id;
                  return (
                    <tr
                      key={row.chw_id}
                      onClick={() => setSelectedChwId(row.chw_id)}
                      className={`hover:bg-surface-container-low transition-colors cursor-pointer ${
                        isRowSelected ? "bg-surface-container-low border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
                            {row.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">
                              {formatBilingualChw(row.name)}
                            </p>
                            <p className="text-xs text-on-surface-variant font-label-sm">{row.chw_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-on-surface-variant">
                        <div>
                          <p className="font-semibold">{row.union_name}</p>
                          <p className="text-xs">{row.upazila}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            row.is_active
                              ? "bg-primary-container/20 text-primary border-primary-container/50"
                              : "bg-error-container/20 text-error border-error-container/50"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              row.is_active ? "bg-primary" : "bg-error"
                            }`}
                          ></span>
                          {row.is_active ? t.status_active : t.status_inactive}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-primary tabular-nums">
                        {toLocalNum(row.patient_count)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredChws.length === 0 && (
              <p className="px-6 py-12 text-center font-bold text-on-surface-variant">{t.empty_chws}</p>
            )}
          </div>
        </div>

        {/* Profile & RBAC Sidebar (Simulating selection of current CHW) */}
        {selectedChw && (
          <aside className="w-full lg:w-80 bg-surface rounded-xl border border-outline-variant flex flex-col min-h-[500px] shadow-sm">
            {/* Profile Header */}
            <div className="p-6 border-b border-outline-variant flex flex-col items-center text-center bg-surface-container-lowest rounded-t-xl">
              <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-lg mb-3 shadow-inner">
                {selectedChw.name.substring(0, 2).toUpperCase()}
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                {formatBilingualChw(selectedChw.name)}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-0.5">
                {selectedChw.chw_id} • {selectedChw.union_name}
              </p>
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    selectedChw.is_active
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-error text-on-error border-error"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {selectedChw.is_active ? "check_circle" : "cancel"}
                  </span>
                  {selectedChw.is_active ? t.status_active : t.status_inactive}
                </span>
              </div>
            </div>

            {/* Settings toggles */}
            <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
              {/* Device & Security */}
              <section>
                <h4 className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">security</span>
                  {lang === "bn" ? "নিরাপত্তা বিবরণ" : "Security Status"}
                </h4>
                <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-on-surface">MFA Status</p>
                      <p className="text-xs text-on-surface-variant">App Authenticator</p>
                    </div>
                    <span className="text-primary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      {lang === "bn" ? "সক্রিয়" : "Active"}
                    </span>
                  </div>
                  <div className="h-px w-full bg-outline-variant/50"></div>
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-on-surface">Device Registered</p>
                      <p className="text-xs text-on-surface-variant">Xiaomi Redmi Note 12</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* RBAC Toggles */}
              <section>
                <h4 className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  {lang === "bn" ? "অ্যাক্সেস অনুমতি" : "Access Permissions"}
                </h4>
                <div className="flex flex-col gap-4">
                  {/* Toggle 1: Clinical Access */}
                  <label className="flex items-start justify-between cursor-pointer group">
                    <div className="pr-4">
                      <p className="font-bold text-on-surface group-hover:text-primary transition-colors text-sm">
                        Clinical Access
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">
                        Can view detailed maternal medical history.
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={clinicalAccess}
                        onChange={(e) => setClinicalAccess(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </label>
                  <div className="h-px w-full bg-outline-variant/30"></div>

                  {/* Toggle 2: Referral Auth */}
                  <label className="flex items-start justify-between cursor-pointer group">
                    <div className="pr-4">
                      <p className="font-bold text-on-surface group-hover:text-primary transition-colors text-sm">
                        Referral Authority
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">
                        Can initiate direct clinic referrals.
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={referralAuth}
                        onChange={(e) => setReferralAuth(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </label>
                  <div className="h-px w-full bg-outline-variant/30"></div>

                  {/* Toggle 3: Export Auth */}
                  <label className="flex items-start justify-between cursor-pointer group">
                    <div className="pr-4">
                      <p className="font-bold text-on-surface group-hover:text-primary transition-colors text-sm">
                        Data Export Auth
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">
                        Can download reports offline.
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={offlineExport}
                        onChange={(e) => setOfflineExport(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest mt-auto rounded-b-xl flex flex-col gap-2">
              <button
                disabled={pending}
                onClick={() => handleToggleStatus(selectedChw.chw_id, selectedChw.is_active)}
                className={`w-full py-2 px-4 rounded-full font-label-lg text-sm text-center font-semibold transition cursor-pointer select-none ${
                  selectedChw.is_active
                    ? "bg-error text-on-error hover:bg-error/95"
                    : "bg-primary text-on-primary hover:bg-surface-tint"
                }`}
              >
                {pending ? "Saving Changes..." : selectedChw.is_active ? "Deactivate Worker" : "Activate Worker"}
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
