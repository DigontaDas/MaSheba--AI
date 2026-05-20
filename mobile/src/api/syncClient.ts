import type { LocalOutboxEvent, SyncResponse } from "@/types/schema";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

function requireApiBaseUrl(): string {
  if (!apiBaseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
  }
  return apiBaseUrl.replace(/\/$/, "");
}

export async function postSync(
  events: LocalOutboxEvent[],
  accessToken: string
): Promise<SyncResponse> {
  const response = await fetch(`${requireApiBaseUrl()}/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      events: events.map((event) => ({
        idempotency_key: event.idempotency_key,
        event_type: event.event_type,
        device_id: event.device_id,
        payload: event.payload
      }))
    })
  });

  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? JSON.stringify(payload)
        : `Sync failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as SyncResponse;
}
