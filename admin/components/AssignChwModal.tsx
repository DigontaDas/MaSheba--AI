"use client";

import { useMemo, useState, useEffect } from "react";
import type { ChwRow, MotherRegistryRow } from "@/utils/admin-types";
import { formatBilingualChw } from "@/utils/translations";

type AssignChwModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mother: MotherRegistryRow;
  chws?: ChwRow[]; // Keep optional for backwards compatibility
  onSuccess: (updatedRow: MotherRegistryRow) => void;
};

export function AssignChwModal({
  isOpen,
  onClose,
  mother,
  onSuccess,
}: AssignChwModalProps) {
  const [fetchedChws, setFetchedChws] = useState<ChwRow[]>([]);
  const [isLoadingChws, setIsLoadingChws] = useState(false);
  const [selectedChwId, setSelectedChwId] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch CHWs client-side from the API endpoint
  useEffect(() => {
    if (isOpen) {
      setIsLoadingChws(true);
      setError("");
      fetch("/dashboard/patients/chws")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load CHWs.");
          return res.json();
        })
        .then((data) => {
          setFetchedChws(data.chws || []);
        })
        .catch((err) => {
          setError(err.message || "Could not retrieve CHW list.");
        })
        .finally(() => {
          setIsLoadingChws(false);
        });
    }
  }, [isOpen]);

  // Sync modal input state with the active mother
  useEffect(() => {
    if (isOpen && mother) {
      setSelectedChwId(mother.chw_id || "");
      setAge(mother.age?.toString() || "");
    }
  }, [isOpen, mother]);

  // Filter for approved and active CHWs
  const approvedActiveChws = useMemo(() => {
    return fetchedChws.filter(
      (c) => c.is_active && c.verification_status === "APPROVED"
    );
  }, [fetchedChws]);

  const selectedChw = useMemo(() => {
    return fetchedChws.find((c) => c.chw_id === selectedChwId);
  }, [fetchedChws, selectedChwId]);

  if (!isOpen) return null;

  const isUnlinked = !mother.patient_id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedChwId) {
      setError("Please select a Community Health Worker.");
      return;
    }

    let ageNum: number | undefined = undefined;
    if (isUnlinked) {
      if (!age) {
        setError("Age is required to link this mother.");
        return;
      }
      ageNum = Number.parseInt(age, 10);
      if (Number.isNaN(ageNum) || ageNum < 10 || ageNum > 60) {
        setError("Age must be between 10 and 60.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/dashboard/patients/assign-chw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motherId: mother.id,
          chwId: selectedChwId,
          age: ageNum,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Failed to assign CHW.");
      }

      onSuccess(payload.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="bg-surface border border-outline-variant rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <div>
            <h3 className="font-headline-md text-lg font-bold text-on-surface">
              {isUnlinked ? "Assign CHW" : "Reassign CHW"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Target Mother: <span className="font-bold text-primary">{mother.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Mother Details Card */}
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-on-surface-variant font-bold uppercase tracking-wider">Phone Number</p>
            <p className="font-semibold text-on-surface mt-0.5">{mother.phone || "Not provided"}</p>
          </div>
          <div>
            <p className="text-on-surface-variant font-bold uppercase tracking-wider">Gestational Age</p>
            <p className="font-bold text-on-surface mt-0.5">{mother.gestational_age_weeks !== null && mother.gestational_age_weeks !== undefined ? `${mother.gestational_age_weeks} weeks` : "Not set"}</p>
          </div>
          <div>
            <p className="text-on-surface-variant font-bold uppercase tracking-wider">Pregnancy Risk Level</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-bold border mt-0.5 ${
              mother.last_risk_level === "HIGH"
                ? "bg-error text-on-error border-error"
                : mother.last_risk_level === "MODERATE"
                ? "bg-secondary-container text-on-secondary-container border-secondary-container"
                : mother.last_risk_level === "LOW"
                ? "bg-primary-container text-on-primary-container border-primary-container"
                : "bg-surface-container-low text-on-surface-variant border-outline-variant"
            }`}>
              {mother.last_risk_level || "Not assessed"}
            </span>
          </div>
          <div className="col-span-2">
            <p className="text-on-surface-variant font-bold uppercase tracking-wider">Currently Assigned CHW</p>
            <p className="font-bold text-primary mt-0.5">
              {mother.chw_name ? `${mother.chw_name} (${mother.chw_id})` : "No CHW currently assigned"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-on-surface-variant font-bold uppercase tracking-wider">Mother's Saved Location</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="font-semibold text-on-surface">
                {mother.location_name || "No location name provided"}
              </p>
              <a
                href="/dashboard/map"
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">map</span>
                Locate on Map
              </a>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {error && (
            <div className="p-3.5 bg-error-container/20 border border-error-container text-error rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          {/* CHW Dropdown Selection */}
          <div className="flex flex-col gap-2">
            <label htmlFor="chw-select" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Select Community Health Worker
            </label>
            {isLoadingChws ? (
              <div className="text-sm text-on-surface-variant py-2.5 flex items-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></span>
                Loading CHWs...
              </div>
            ) : (
              <select
                id="chw-select"
                value={selectedChwId}
                onChange={(e) => setSelectedChwId(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer text-on-surface bg-no-repeat"
              >
                <option value="" className="text-on-surface-variant">-- Select a CHW --</option>
                {approvedActiveChws.map((chw) => (
                  <option key={chw.chw_id} value={chw.chw_id} className="text-on-surface">
                    {formatBilingualChw(chw.name)} ({chw.union_name} Union, {chw.upazila}) — {chw.patient_count} patients
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Age Input (Unlinked Mothers Only) */}
          {isUnlinked && (
            <div className="flex flex-col gap-2">
              <label htmlFor="mother-age" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Enter Mother's Age *
              </label>
              <input
                id="mother-age"
                type="number"
                min="10"
                max="60"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age between 10 and 60"
                required
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/50"
              />
              <p className="text-[11px] text-on-surface-variant font-medium">
                Required to initialize the patient medical record.
              </p>
            </div>
          )}

          {/* Selection Preview */}
          {selectedChw && (
            <div className="p-4 bg-primary-container/10 border border-primary-container/20 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">
                {selectedChw.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase">Selected Target CHW</p>
                <p className="text-sm font-bold text-on-surface">{formatBilingualChw(selectedChw.name)}</p>
                <p className="text-xs text-on-surface-variant">{selectedChw.union_name} Union</p>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex gap-3 mt-4 border-t border-outline-variant pt-4 bg-surface">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-outline-variant font-label-lg text-sm text-center font-bold hover:bg-surface-container-high transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-label-lg text-sm text-center font-bold hover:bg-surface-tint transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Assigning..." : "Assign CHW"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
