"use client";

import { useState } from "react";
import type { HeatmapRow } from "@/utils/admin-types";

// Coordinates mapped exactly to the "NARSHINGDI" region of the Bangladesh Map image
const positions: Record<string, { x: number; y: number }> = {
  "Narsingdi Sadar": { x: 58.5, y: 44.5 },
  Palash: { x: 56.0, y: 43.5 },
  Shibpur: { x: 57.5, y: 42.5 },
  Raipura: { x: 60.5, y: 43.5 },
  Monohardi: { x: 57.0, y: 40.5 },
  Belabo: { x: 59.5, y: 41.5 },
};

export function UpazilaRiskMap({ rows }: { rows: HeatmapRow[] }) {
  const [selectedRow, setSelectedRow] = useState<HeatmapRow | null>(null);

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
  
  const maxHigh = Math.max(1, ...normalized.map((row) => row.high_count));

  return (
    <div className="rounded-xl border border-outline-variant bg-surface overflow-hidden shadow-sm flex flex-col">
      <div className="relative h-[650px] w-full bg-surface-container-low flex justify-center items-center overflow-hidden p-4">
        
        {/* Map Container relative to the image shape */}
        <div className="relative h-full aspect-[2/3] max-w-full flex justify-center items-center">
          <img
            src="/bangladesh-map.jpg"
            alt="Bangladesh Map"
            className="h-full object-contain pointer-events-none select-none rounded-lg border border-outline-variant/30"
          />

          {/* District Highlights / Upazila Markers */}
          {normalized.map((row) => {
            const pos = positions[row.upazila] || { x: 50, y: 50 };
            const intensity = row.high_count / maxHigh;
            const size = 18 + intensity * 18; // Size scaled nicely on full map

            return (
              <button
                key={row.upazila}
                onClick={() => setSelectedRow(row)}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-error flex items-center justify-center text-white font-bold cursor-pointer transition-transform hover:scale-125 select-none shadow-md"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  boxShadow: "0 0 10px rgba(159, 64, 45, 0.6)",
                }}
                title={`${row.upazila}: ${row.high_count} High Risk`}
              >
                {/* Visual pulse for high-risk counts */}
                {row.high_count > 0 && (
                  <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                )}
                <span className="font-label-sm text-[9px] leading-none z-10">{row.high_count}</span>
              </button>
            );
          })}

          {/* Interactive Detailed Popup card */}
          {selectedRow && (
            <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 bg-surface/95 backdrop-blur-sm border border-outline-variant rounded-xl p-4 shadow-lg w-72 z-20 transition-all duration-200">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-headline-md text-[16px] font-bold text-on-surface">
                  {selectedRow.upazila}
                </h4>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="text-on-surface-variant hover:text-on-surface cursor-pointer p-0.5 rounded-full hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="space-y-2 text-xs font-label-sm">
                <div className="flex justify-between items-center py-1 border-b border-outline-variant/30">
                  <span className="text-on-surface-variant">Total Tracked Mothers</span>
                  <span className="font-bold text-on-surface">{selectedRow.total_patients}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-error"></span>
                    High Risk
                  </span>
                  <span className="font-bold text-error">{selectedRow.high_count}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                    Moderate Risk
                  </span>
                  <span className="font-bold text-on-secondary-container">{selectedRow.moderate_count}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                    Low Risk
                  </span>
                  <span className="font-bold text-primary">{selectedRow.low_count}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-surface/90 backdrop-blur-sm p-3 border border-outline-variant rounded-lg text-xs flex flex-col gap-1.5 max-w-[200px] shadow-sm z-10 font-label-sm">
          <p className="font-bold text-on-surface mb-0.5">Narsingdi Districts</p>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="w-3 h-3 rounded-full bg-error border border-white inline-block"></span>
            <span>Risk density marker</span>
          </div>
          <p className="text-[10px] text-on-surface-variant/80 italic mt-0.5">Click any marker to view upazila details.</p>
        </div>
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
