"use client";

import { useMemo, useState } from "react";
import type { ChwRow, MotherRegistryRow } from "@/utils/admin-types";
import { formatBilingualChw } from "@/utils/translations";

type AssignChwModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mother: MotherRegistryRow;
  chws: ChwRow[];
  onSuccess: (updatedRow: MotherRegistryRow) => void;
};

export function AssignChwModal({
  isOpen,
  onClose,
  mother,
  chws,
  onSuccess,
}: AssignChwModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChwId, setSelectedChwId] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter for approved and active CHWs
  const approvedActiveChws = useMemo(() => {
    return chws.filter(
      (c) => c.is_active && c.verification_status === "APPROVED"
    );
  }, [chws]);

  // Search filter
  const filteredChws = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return approvedActiveChws;
    return approvedActiveChws.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.union_name.toLowerCase().includes(q) ||
        c.upazila.toLowerCase().includes(q)
    );
  }, [approvedActiveChws, searchQuery]);

  const selectedChw = useMemo(() => {
    return approvedActiveChws.find((c) => c.chw_id === selectedChwId);
  }, [approvedActiveChws, selectedChwId]);

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
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {error && (
            <div className="p-3.5 bg-error-container/20 border border-error-container text-error rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          {/* CHW Search and Select */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Select Community Health Worker
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search CHW name, union..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl font-body-md text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-on-surface-variant/50"
              />
            </div>

            {/* CHW List */}
            <div className="border border-outline-variant rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-outline-variant bg-surface-container-lowest mt-1">
              {filteredChws.length === 0 ? (
                <div className="p-4 text-center text-xs text-on-surface-variant font-medium">
                  No approved and active CHWs found.
                </div>
              ) : (
                filteredChws.map((chw) => {
                  const isSelected = selectedChwId === chw.chw_id;
                  return (
                    <button
                      key={chw.chw_id}
                      type="button"
                      onClick={() => setSelectedChwId(chw.chw_id)}
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition-all hover:bg-surface-container-low cursor-pointer ${
                        isSelected ? "bg-primary-container/25 border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-on-surface">
                          {formatBilingualChw(chw.name)}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          Union: {chw.union_name} • {chw.upazila}
                        </p>
                      </div>
                      {isSelected ? (
                        <span className="material-symbols-outlined text-primary text-[20px]">
                          check_circle
                        </span>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tabular-nums">
                          {chw.patient_count} patients
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
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
              {isSubmitting ? "Assigning..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
