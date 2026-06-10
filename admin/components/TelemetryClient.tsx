"use client";

import { useState } from "react";
import { SmsFailure } from "@/utils/admin-types";
import { SmsReviewButton } from "./SmsReviewButton";

type SafetyLevel = "ALL" | "LOW" | "MODERATE" | "HIGH" | "EMERGENCY";

interface TelemetryClientProps {
  initialFailures: SmsFailure[];
}

export function TelemetryClient({ initialFailures }: TelemetryClientProps) {
  const [activeTab, setActiveTab] = useState<SafetyLevel>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Safety level classification helper
  const getSafetyLevel = (message: string): "LOW" | "MODERATE" | "HIGH" | "EMERGENCY" => {
    const msg = (message || "").toLowerCase();
    
    // EMERGENCY check
    if (
      msg.includes("জরুরি") ||
      msg.includes("emergency") ||
      msg.includes("danger") ||
      msg.includes("বিপদ")
    ) {
      return "EMERGENCY";
    }

    // HIGH check
    if (
      msg.includes("উচ্চ") ||
      msg.includes("high") ||
      msg.includes("ঝুঁকি") ||
      msg.includes("risk") ||
      msg.includes("রক্তচাপ") ||
      msg.includes("seizure")
    ) {
      return "HIGH";
    }

    // MODERATE check
    if (
      msg.includes("মাঝারি") ||
      msg.includes("moderate") ||
      msg.includes("সতর্কতা") ||
      msg.includes("warning") ||
      msg.includes("পরিদর্শন")
    ) {
      return "MODERATE";
    }

    return "LOW";
  };

  // Classify all items and filter them
  const classifiedFailures = initialFailures.map((failure) => ({
    ...failure,
    safetyLevel: getSafetyLevel(failure.message),
  }));

  const filteredFailures = classifiedFailures.filter((failure) => {
    const matchesTab = activeTab === "ALL" || failure.safetyLevel === activeTab;
    const matchesSearch =
      failure.phone_number.includes(searchQuery) ||
      (failure.message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (failure.error_message || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getSafetyBadge = (level: "LOW" | "MODERATE" | "HIGH" | "EMERGENCY") => {
    switch (level) {
      case "EMERGENCY":
        return (
          <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            EMERGENCY
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            HIGH
          </span>
        );
      case "MODERATE":
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-yellow-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            MODERATE
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            LOW
          </span>
        );
    }
  };

  const tabs: { value: SafetyLevel; label: string; count: number }[] = [
    { value: "ALL", label: "All Logs", count: classifiedFailures.length },
    { value: "LOW", label: "Low", count: classifiedFailures.filter(f => f.safetyLevel === "LOW").length },
    { value: "MODERATE", label: "Moderate", count: classifiedFailures.filter(f => f.safetyLevel === "MODERATE").length },
    { value: "HIGH", label: "High", count: classifiedFailures.filter(f => f.safetyLevel === "HIGH").length },
    { value: "EMERGENCY", label: "Emergency", count: classifiedFailures.filter(f => f.safetyLevel === "EMERGENCY").length },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Tabs Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-surface-container-low border border-outline-variant rounded-xl w-fit">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${
                  isActive
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-on-primary/20 text-on-primary" : "bg-outline-variant text-on-surface-variant"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-variant/70">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            type="text"
            placeholder="Search phone, message, error..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-surface border border-outline rounded-xl focus:outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant/60 transition-colors"
          />
        </div>
      </div>

      {/* Telemetry Table Card */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Sync and Transmission Ledger
          </h3>
          <span className="text-xs font-bold text-on-surface-variant/80">
            Showing {filteredFailures.length} of {classifiedFailures.length} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-3.5 font-medium">Recipient Phone</th>
                <th className="px-6 py-3.5 font-medium">Safety Level</th>
                <th className="px-6 py-3.5 font-medium">Attempts</th>
                <th className="px-6 py-3.5 font-medium">RAG Payload / Error Details</th>
                <th className="px-6 py-3.5 font-medium">Review Status</th>
                <th className="px-6 py-3.5 font-medium">Created Time</th>
                <th className="px-6 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant bg-surface">
              {filteredFailures.map((failure) => {
                const isExhausted = failure.attempts >= 3;
                return (
                  <tr
                    key={failure.id}
                    className={`transition-colors border-l-4 ${
                      isExhausted
                        ? "bg-red-500/5 hover:bg-red-500/10 border-l-red-500"
                        : "hover:bg-surface-container-low/50 border-l-transparent"
                    }`}
                  >
                    <td className="whitespace-nowrap px-6 py-3.5 font-bold text-on-surface">
                      <div className="flex flex-col">
                        <span>{failure.phone_number}</span>
                        {isExhausted && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500 font-bold mt-0.5">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            Retry Exhausted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      {getSafetyBadge(failure.safetyLevel)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 font-bold tabular-nums">
                      <span className={isExhausted ? "text-red-500" : "text-on-surface-variant"}>
                        {failure.attempts}
                      </span>
                    </td>
                    <td className="max-w-md px-6 py-3.5 text-on-surface-variant">
                      <div className="flex flex-col gap-1">
                        {failure.message && (
                          <div className="text-xs font-semibold text-on-surface line-clamp-2" title={failure.message}>
                            {failure.message}
                          </div>
                        )}
                        {failure.error_message && (
                          <div className="text-[11px] font-medium text-red-500 truncate" title={failure.error_message}>
                            <span className="font-bold">Error:</span> {failure.error_message}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      {failure.review_status === "OPEN" ? (
                        <span className="inline-flex items-center gap-1 bg-secondary-container/20 text-on-secondary-container px-2.5 py-0.5 rounded-full text-xs font-bold border border-secondary-container/45">
                          <span className="material-symbols-outlined text-[12px]">gpp_maybe</span>
                          {failure.review_status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-primary-container/20 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold border border-primary-container/45">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          {failure.review_status}
                        </span>
                      )}
                    </td>
                    <td suppressHydrationWarning className="whitespace-nowrap px-6 py-3.5 text-on-surface-variant font-semibold text-xs font-label-sm">
                      {new Date(failure.created_at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right font-label-lg">
                      {failure.review_status === "OPEN" ? (
                        <SmsReviewButton id={failure.id} />
                      ) : (
                        <span className="text-xs font-semibold text-on-surface-variant/65 italic">Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredFailures.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center font-bold text-on-surface-variant">
                    No telemetry failures match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
