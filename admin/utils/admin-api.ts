"use server";

import { requireAdminBearerToken } from "@/utils/admin-auth";
import type { AuditEvent, ChwReassignmentRequest, ChwReview, ChwReviewSummary, ChwRow, MotherRegistryRow, PendingChwRow, QaItem, SmsFailure, SummaryPayload, ConnectionRequest } from "@/utils/admin-types";

const apiBaseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:8000";

type JsonObject = Record<string, unknown>;

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await requireAdminBearerToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Admin API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getSummary(): Promise<SummaryPayload> {
  return adminFetch<SummaryPayload>("/api/v1/admin/summary");
}

export async function getChws(): Promise<ChwRow[]> {
  const payload = await adminFetch<{ chws: ChwRow[] }>("/api/v1/admin/chws");
  return payload.chws;
}

export async function getPendingChws(): Promise<PendingChwRow[]> {
  const payload = await adminFetch<{ chws: PendingChwRow[] }>("/api/v1/admin/chws/pending-verifications");
  return payload.chws;
}

export async function updateChwStatus(chwId: string, isActive: boolean): Promise<void> {
  await adminFetch(`/api/v1/admin/chws/${encodeURIComponent(chwId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function updateChwVerification(
  chwId: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string
): Promise<void> {
  await adminFetch(`/api/v1/admin/chws/${encodeURIComponent(chwId)}/verification`, {
    method: "PATCH",
    body: JSON.stringify({
      verification_status: status,
      rejection_reason: rejectionReason,
    }),
  });
}

export async function getPatients(limit?: number): Promise<MotherRegistryRow[]> {
  const query = limit ? `?limit=${limit}` : "";
  const payload = await adminFetch<{ patients: MotherRegistryRow[] }>(`/api/v1/admin/patients${query}`);
  return payload.patients;
}

export async function getEmergencies(): Promise<any[]> {
  const payload = await adminFetch<{ emergencies: any[] }>("/api/v1/admin/emergencies");
  return payload.emergencies;
}


export async function getQaItems(): Promise<QaItem[]> {
  const payload = await adminFetch<{ items: QaItem[] }>("/api/v1/admin/qa");
  return payload.items;
}

export async function createQaItem(payload: JsonObject): Promise<void> {
  await adminFetch("/api/v1/admin/qa", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQaItem(id: string, payload: JsonObject): Promise<void> {
  await adminFetch(`/api/v1/admin/qa/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteQaItem(id: string): Promise<void> {
  await adminFetch(`/api/v1/admin/qa/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getSmsFailures(): Promise<SmsFailure[]> {
  const payload = await adminFetch<{ failures: SmsFailure[] }>("/api/v1/admin/telemetry/sms");
  return payload.failures;
}

export async function reviewSmsFailure(id: string, reviewStatus: SmsFailure["review_status"], reviewNotes: string): Promise<void> {
  await adminFetch(`/api/v1/admin/telemetry/sms/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ review_status: reviewStatus, review_notes: reviewNotes }),
  });
}

export async function getAuditEvents(): Promise<AuditEvent[]> {
  const payload = await adminFetch<{ events: AuditEvent[] }>("/api/v1/admin/audit");
  return payload.events;
}

export async function exportUrl(format: "csv" | "pdf"): Promise<string> {
  return `/api/admin/export?format=${format}`;
}

export async function assignChw(motherId: string, chwId: string, age?: number): Promise<MotherRegistryRow> {
  return adminFetch<MotherRegistryRow>(`/api/v1/admin/mothers/${encodeURIComponent(motherId)}/chw-assignment`, {
    method: "PATCH",
    body: JSON.stringify({ chw_id: chwId, age }),
  });
}

export async function getPendingRequests(): Promise<ConnectionRequest[]> {
  return adminFetch<ConnectionRequest[]>("/api/v1/admin/connection-requests/pending");
}

export async function assignRequestChw(requestId: string, chwId: string): Promise<void> {
  await adminFetch(`/api/v1/admin/connection-requests/${encodeURIComponent(requestId)}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ chw_id: chwId }),
  });
}

export async function getChwReviewSummary(): Promise<ChwReviewSummary[]> {
  const payload = await adminFetch<{ reviews: ChwReviewSummary[] }>("/api/v1/admin/chw-reviews/summary");
  return payload.reviews;
}

export async function getChwReviews(chwId?: string): Promise<ChwReview[]> {
  const query = chwId ? `?chw_id=${encodeURIComponent(chwId)}` : "";
  const payload = await adminFetch<{ reviews: ChwReview[] }>(`/api/v1/admin/chw-reviews${query}`);
  return payload.reviews;
}

export async function moderateChwReview(
  reviewId: string,
  status: ChwReview["status"],
  moderationReason?: string
): Promise<void> {
  await adminFetch(`/api/v1/admin/chw-reviews/${encodeURIComponent(reviewId)}/moderation`, {
    method: "PATCH",
    body: JSON.stringify({ status, moderation_reason: moderationReason }),
  });
}

export async function getReassignmentRequests(): Promise<ChwReassignmentRequest[]> {
  return adminFetch<ChwReassignmentRequest[]>("/api/v1/admin/chw-reassignment-requests");
}

export async function assignReassignmentRequest(requestId: string, newChwId: string): Promise<void> {
  await adminFetch(`/api/v1/admin/chw-reassignment-requests/${encodeURIComponent(requestId)}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ new_chw_id: newChwId }),
  });
}

export async function dismissReassignmentRequest(requestId: string, reason?: string): Promise<void> {
  await adminFetch(`/api/v1/admin/chw-reassignment-requests/${encodeURIComponent(requestId)}/dismiss`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}
