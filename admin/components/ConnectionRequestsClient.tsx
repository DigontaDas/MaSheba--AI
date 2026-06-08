"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { assignRequestChw, getPendingRequests } from "@/utils/admin-api";
import type { ConnectionRequest, ChwRow } from "@/utils/admin-types";
import { createClient } from "@/utils/supabase/client";

// Dynamically import the RequestsMap component with SSR disabled to prevent Leaflet window failures
const RequestsMap = dynamic(
  () => import("@/components/RequestsMap").then((mod) => mod.RequestsMap),
  { ssr: false, loading: () => <div className="h-[450px] bg-surface-container-low flex items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant font-label-md">Loading Interactive Map...</div> }
);

export function ConnectionRequestsClient({
  initialRequests,
  chws,
}: {
  initialRequests: ConnectionRequest[];
  chws: ChwRow[];
}) {
  const [requests, setRequests] = useState<ConnectionRequest[]>(initialRequests);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    initialRequests.length > 0 ? initialRequests[0].id : null
  );
  const [assignedChwId, setAssignedChwId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  interface SuggestedChw {
    chw_id: string;
    name: string;
    union_name: string | null;
    upazila: string;
    distance_km: number;
  }

  const [suggestedChws, setSuggestedChws] = useState<SuggestedChw[]>([]);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  useEffect(() => {
    if (!selectedRequest?.lat || !selectedRequest?.lng) {
      setSuggestedChws([]);
      return;
    }

    let active = true;
    const fetchSuggestions = async () => {
      setFetchingSuggestions(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("find_nearby_chws", {
          mother_lat: selectedRequest.lat,
          mother_lng: selectedRequest.lng,
          radius_km: 15.0,
        });

        if (error) {
          console.error("Error fetching nearby CHWs:", error);
          if (active) setSuggestedChws([]);
          return;
        }

        if (active) {
          setSuggestedChws((data || []).slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to query nearby CHWs:", err);
        if (active) setSuggestedChws([]);
      } finally {
        if (active) setFetchingSuggestions(false);
      }
    };

    fetchSuggestions();

    return () => {
      active = false;
    };
  }, [selectedRequest?.lat, selectedRequest?.lng]);

  // Filter active, verified CHWs
  const activeChws = chws.filter(
    (c) => c.verification_status === "APPROVED" && c.is_active
  );

  const handleAssign = async () => {
    if (!selectedRequestId || !assignedChwId) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await assignRequestChw(selectedRequestId, assignedChwId);
      
      // Remove the assigned request from the list
      const updatedRequests = requests.filter((r) => r.id !== selectedRequestId);
      setRequests(updatedRequests);
      
      setSuccessMsg("CHW successfully assigned and mother profile linked.");
      
      // Auto select next request if available
      if (updatedRequests.length > 0) {
        setSelectedRequestId(updatedRequests[0].id);
      } else {
        setSelectedRequestId(null);
      }
      setAssignedChwId("");
    } catch (err: any) {
      setError(err.message || "Failed to assign CHW.");
    } finally {
      setLoading(false);
    }
  };

  const refreshRequests = async () => {
    try {
      const fresh = await getPendingRequests();
      setRequests(fresh);
      if (fresh.length > 0 && (!selectedRequestId || !fresh.some(r => r.id === selectedRequestId))) {
        setSelectedRequestId(fresh[0].id);
      }
    } catch (err) {
      console.error("Failed to refresh connection requests:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left side: Requests List & Details */}
      <div className="lg:col-span-8 space-y-6">
        {/* Dynamic map */}
        <RequestsMap
          requests={requests}
          chws={activeChws}
          selectedRequestId={selectedRequestId}
          onSelectRequest={(id) => {
            setSelectedRequestId(id);
            setSuccessMsg(null);
            setError(null);
          }}
        />

        {/* List of pending requests */}
        <div className="rounded-xl border border-outline-variant bg-surface overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <div>
              <h3 className="font-headline-md text-[18px] font-bold text-on-surface">
                Pending &amp; Assigned Requests ({requests.length})
              </h3>
              <p className="font-label-sm text-xs text-on-surface-variant">
                Mothers awaiting assignment or visit acceptance by CHW
              </p>
            </div>
            <button
              onClick={refreshRequests}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-high transition-colors font-label-md text-xs text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Refresh
            </button>
          </div>

          <div className="divide-y divide-outline-variant/60 max-h-[350px] overflow-y-auto">
            {requests.length > 0 ? (
              requests.map((req) => {
                const isSelected = req.id === selectedRequestId;
                const isAssigned = req.status === "assigned";

                // Calculate expiry countdown for assigned requests
                let expiryLabel: string | null = null;
                if (isAssigned && req.assigned_at) {
                  const assignedMs = new Date(req.assigned_at).getTime();
                  const nowMs = Date.now();
                  const elapsedHours = (nowMs - assignedMs) / (1000 * 60 * 60);
                  const remainingHours = Math.max(0, 48 - elapsedHours);
                  if (elapsedHours >= 24) {
                    expiryLabel = `Expires in ${remainingHours.toFixed(0)}h`;
                  }
                }

                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelectedRequestId(req.id);
                      setSuccessMsg(null);
                      setError(null);
                    }}
                    className={`p-4 transition-colors cursor-pointer flex justify-between items-start ${
                      isSelected
                        ? "bg-primary-container/10 border-l-4 border-primary"
                        : "hover:bg-surface-container-lowest"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-on-surface font-headline-sm text-sm">
                          {req.mother_name}
                        </span>
                        {isAssigned ? (
                          <span className="text-[10px] bg-tertiary-container/30 text-tertiary px-2 py-0.5 rounded-full font-bold">
                            Assigned
                          </span>
                        ) : (
                          <span className="text-[10px] bg-error-container/20 text-error px-2 py-0.5 rounded-full font-bold">
                            Pending
                          </span>
                        )}
                        {expiryLabel && (
                          <span className="text-[10px] bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded-full font-bold animate-pulse">
                            ⚠️ {expiryLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant font-label-sm">
                        Requested: {new Date(req.created_at).toLocaleString()}
                      </p>
                      {isAssigned && req.assigned_at && (
                        <p className="text-xs text-tertiary font-label-sm">
                          Assigned: {new Date(req.assigned_at).toLocaleString()}
                        </p>
                      )}
                      {req.notes && (
                        <p className="text-xs text-on-surface-variant/80 italic font-body-sm line-clamp-1">
                          &quot;{req.notes}&quot;
                        </p>
                      )}
                    </div>
                    {req.lat && req.lng && (
                      <span className="text-[11px] font-mono text-outline bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30 shrink-0">
                        {req.lat.toFixed(4)}, {req.lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-on-surface-variant font-body-md">
                <span className="material-symbols-outlined text-outline text-[40px] mb-2 block">
                  check_circle
                </span>
                No pending or assigned connection requests.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Detailed Assign Panel */}
      <div className="lg:col-span-4 space-y-6">
        <div className="rounded-xl border border-outline-variant bg-surface p-5 shadow-sm space-y-5">
          <h3 className="font-headline-md text-[18px] font-bold text-on-surface">
            Assignment Panel
          </h3>

          {successMsg && (
            <div className="p-3 bg-secondary-container/20 border border-secondary text-on-secondary-container rounded-lg text-xs font-label-md flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
              {successMsg}
            </div>
          )}

          {error && (
            <div className="p-3 bg-error-container/20 border border-error text-error rounded-lg text-xs font-label-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          {selectedRequest ? (
            <div className="space-y-4">
              {/* Selected Mother details */}
              <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60 space-y-2 text-xs font-label-sm">
                <p className="text-[10px] text-outline uppercase tracking-wider font-bold">Selected Request</p>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Mother Name:</span>
                  <span className="font-bold text-on-surface">{selectedRequest.mother_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Request Time:</span>
                  <span className="text-on-surface">
                    {new Date(selectedRequest.created_at).toLocaleDateString()}
                  </span>
                </div>
                {selectedRequest.lat && selectedRequest.lng && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">GPS Coords:</span>
                    <span className="font-mono text-on-surface">
                      {selectedRequest.lat.toFixed(4)}, {selectedRequest.lng.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Suggested CHWs Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">distance</span>
                    Suggested CHWs (within 15 km)
                  </label>
                  {fetchingSuggestions && (
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full"></span>
                  )}
                </div>

                {fetchingSuggestions ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse bg-surface-container-low border border-outline-variant/40 rounded-lg p-2.5 flex justify-between items-center">
                        <div className="space-y-1.5 w-2/3">
                          <div className="h-3 bg-outline-variant/50 rounded w-3/4"></div>
                          <div className="h-2.5 bg-outline-variant/50 rounded w-1/2"></div>
                        </div>
                        <div className="h-5 bg-outline-variant/50 rounded-full w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : suggestedChws.length > 0 ? (
                  <div className="space-y-2">
                    {suggestedChws.map((chw) => {
                      const isSelected = assignedChwId === chw.chw_id;
                      return (
                        <button
                          key={chw.chw_id}
                          type="button"
                          onClick={() => setAssignedChwId(chw.chw_id)}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all duration-200 flex justify-between items-center group cursor-pointer ${
                            isSelected
                              ? "bg-primary-container/20 border-primary shadow-sm"
                              : "bg-surface-container-lowest border-outline-variant/60 hover:border-primary/50 hover:bg-surface-container-low"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors flex items-center gap-1">
                              {chw.name}
                              {isSelected && (
                                <span className="material-symbols-outlined text-[14px] text-primary font-bold">check_circle</span>
                              )}
                            </p>
                            <p className="text-[10px] text-on-surface-variant">
                              {chw.union_name ? `${chw.union_name}, ` : ""}{chw.upazila}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-primary-container/15 text-primary group-hover:bg-primary group-hover:text-white"
                          }`}>
                            {chw.distance_km.toFixed(1)} km
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-center">
                    <span className="material-symbols-outlined text-outline text-[20px] mb-0.5 block">
                      location_off
                    </span>
                    <p className="text-[10px] text-on-surface-variant">
                      No active CHWs found within 15 km.
                    </p>
                  </div>
                )}
              </div>

              {/* CHW Selection Form */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface">
                  Select Community Health Worker
                </label>
                <select
                  value={assignedChwId}
                  onChange={(e) => setAssignedChwId(e.target.value)}
                  className="w-full bg-background text-on-surface border border-outline-variant rounded-lg p-2.5 text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="">-- Choose Active CHW --</option>
                  {activeChws.map((c) => (
                    <option key={c.chw_id} value={c.chw_id}>
                      {c.name} ({c.union_name || "No Union"}, {c.upazila})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-on-surface-variant italic">
                  Only verified and active health workers are listed.
                </p>
              </div>

              <button
                onClick={handleAssign}
                disabled={loading || !assignedChwId}
                className="w-full bg-primary hover:bg-primary-container hover:text-on-primary-container text-white disabled:bg-surface-container disabled:text-outline py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                    Assigning...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                    Confirm Assignment
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="py-8 text-center text-on-surface-variant font-label-md text-xs">
              <span className="material-symbols-outlined text-outline text-[32px] mb-2 block">
                info
              </span>
              Select a mother's request from the list or map to assign a health worker.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
