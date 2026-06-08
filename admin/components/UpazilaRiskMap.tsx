"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getChws, getPatients } from "@/utils/admin-api";
import type { ChwRow, MotherRegistryRow, HeatmapRow } from "@/utils/admin-types";

// Dynamically import RequestsMap to prevent Leaflet SSR errors
const RequestsMap = dynamic(
  () => import("@/components/RequestsMap").then((mod) => mod.RequestsMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[450px] bg-surface-container-low flex items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant font-label-md">
        Loading Live Map...
      </div>
    ),
  }
);

export function UpazilaRiskMap({ rows }: { rows: HeatmapRow[] }) {
  const [selectedRow, setSelectedRow] = useState<HeatmapRow | null>(null);
  const [mothers, setMothers] = useState<MotherRegistryRow[]>([]);
  const [chws, setChws] = useState<ChwRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiveMapData() {
      try {
        const [chwsData, mothersData] = await Promise.all([
          getChws(),
          getPatients(1000), // Get up to 1000 tracked mothers for overview map
        ]);
        
        // Filter active, verified CHWs
        const activeChws = chwsData.filter(
          (c) => c.verification_status === "APPROVED" && c.is_active
        );
        
        setChws(activeChws);
        setMothers(mothersData);
      } catch (err) {
        console.error("Failed to fetch live map data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLiveMapData();
  }, []);

  const normalized = rows.length
    ? rows
    : [
        {
          upazila: "Narsingdi Sadar",
          low_count: 0,
          moderate_count: 0,
          high_count: 0,
          total_patients: 0,
        },
      ];

  return (
    <div className="rounded-xl border border-outline-variant bg-surface overflow-hidden shadow-sm flex flex-col">
      {/* Live Map Layer */}
      <div className="p-4 bg-surface-container-low/30">
        <RequestsMap
          requests={[]} // Connection requests not shown here
          chws={chws}
          mothers={mothers}
          selectedRequestId={null}
          onSelectRequest={() => {}}
        />
      </div>

      {/* Upazila Detail Cards list below */}
      <div className="p-4 border-t border-outline-variant/60 bg-surface-container-lowest grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {normalized.map((row) => (
          <div
            className={`rounded-lg border p-3 transition-colors cursor-pointer ${
              selectedRow?.upazila === row.upazila
                ? "border-primary bg-primary-container/5"
                : "border-outline-variant bg-surface hover:border-primary-container"
            }`}
            onClick={() => setSelectedRow(row)}
            key={row.upazila}
          >
            <p className="font-headline-md text-[16px] font-bold text-on-surface">{row.upazila}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-on-surface-variant font-label-sm">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                {row.high_count} High Risk
              </span>
              <span className="text-on-surface-variant/80">
                {row.total_patients} Total Patients
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
