"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface EmergencyCase {
  mother_id: string;
  name: string;
  phone: string | null;
  gestational_age_weeks: number | null;
  location_name: string | null;
  chw_name: string | null;
  chw_phone: string | null;
}

export function EmergencyCalloutPanel() {
  const [emergencies, setEmergencies] = useState<EmergencyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmergencies = async () => {
    try {
      const res = await fetch("/dashboard/emergencies");
      if (!res.ok) throw new Error("Failed to fetch emergencies");
      const data = await res.json();
      setEmergencies(data.emergencies || []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load emergency data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && emergencies.length === 0) {
    return (
      <div className="bg-red-50/10 border border-red-500/20 rounded-xl p-6 text-center text-on-surface-variant font-label-md">
        <div className="animate-spin inline-block w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full mr-2 vertical-middle"></div>
        Loading Emergency Alerts...
      </div>
    );
  }

  return (
    <section className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 shadow-sm mb-6 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4 text-red-600 dark:text-red-400">
        <span className="material-symbols-outlined text-[24px] animate-pulse" data-weight="fill">
          emergency
        </span>
        <h2 className="font-headline-md text-lg font-bold uppercase tracking-wider">
          Emergency Callout Panel (জরুরি অবস্থা)
        </h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold mb-4">
          {error}
        </div>
      )}

      {emergencies.length === 0 ? (
        <div className="bg-surface/50 rounded-xl p-8 text-center text-red-700 font-bold border border-red-500/10">
          কোনো জরুরি কেস নেই (No active emergency cases)
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {emergencies.map((item) => (
            <div
              key={item.mother_id}
              className="bg-surface border-2 border-red-500/40 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-red-500 transition-colors gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-start">
                  <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                    {item.name}
                  </h3>
                  <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 uppercase tracking-wider">
                    High Risk
                  </span>
                </div>

                <div className="text-xs text-on-surface-variant space-y-1">
                  <p className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">phone</span>
                    <span className="font-semibold">Phone:</span>{" "}
                    <span className="font-mono">{item.phone || "Not provided"}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    <span className="font-semibold">Gestational Age:</span>{" "}
                    {item.gestational_age_weeks !== null && item.gestational_age_weeks !== undefined
                      ? `${item.gestational_age_weeks} weeks`
                      : "Not set"}
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span className="font-semibold">Location:</span>{" "}
                    <span className="truncate max-w-[200px]" title={item.location_name || ""}>
                      {item.location_name || "Not provided"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-red-50/50 dark:bg-red-500/5 rounded-lg p-2.5 border border-red-500/10 text-xs flex flex-col gap-1">
                <p className="font-bold text-red-700 dark:text-red-400 uppercase tracking-wider text-[9px]">
                  Assigned Health Worker
                </p>
                <p className="font-semibold text-on-surface">
                  {item.chw_name || "No CHW Linked"}
                </p>
                {item.chw_phone && (
                  <p className="font-mono text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[12px]">phone</span>
                    {item.chw_phone}
                  </p>
                )}
              </div>

              <Link
                href="/dashboard/map"
                className="inline-flex items-center gap-1.5 justify-center py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">map</span>
                Locate on Map
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
