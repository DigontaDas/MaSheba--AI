"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { assignRequestChw, getPendingRequests } from "@/utils/admin-api";
import type { ConnectionRequest, ChwRow } from "@/utils/admin-types";

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

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);
  
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
                Pending Requests ({requests.length})
              </h3>
              <p className="font-label-sm text-xs text-on-surface-variant">
                Queue of mothers requesting location assignment
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface font-headline-sm text-sm">
                          {req.mother_name}
                        </span>
                        <span className="text-[10px] bg-error-container/20 text-error px-2 py-0.5 rounded-full font-bold">
                          Pending
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant font-label-sm">
                        Requested: {new Date(req.created_at).toLocaleString()}
                      </p>
                      {req.notes && (
                        <p className="text-xs text-on-surface-variant/80 italic font-body-sm line-clamp-1">
                          "{req.notes}"
                        </p>
                      )}
                    </div>
                    {req.lat && req.lng && (
                      <span className="text-[11px] font-mono text-outline bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30">
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
                No pending connection requests. All mothers assigned!
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
