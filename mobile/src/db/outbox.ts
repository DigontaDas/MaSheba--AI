import type { LocalOutboxEvent, OutboxStatus, SyncResult } from "@/types/schema";
import { nowIso } from "@/utils/time";
import { getDB } from "./database";
import { runLocalDb } from "./localDbAccess";

type OutboxRow = Omit<LocalOutboxEvent, "payload" | "status"> & {
  payload: string;
  status: string;
};

function mapOutbox(row: OutboxRow): LocalOutboxEvent {
  return {
    ...row,
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    status: row.status as OutboxStatus
  };
}

export async function getPendingOutbox(limit = 100): Promise<LocalOutboxEvent[]> {
  return runLocalDb(async () => {
    const db = await getDB();
    const rows = await db.getAllAsync<OutboxRow>(
      "SELECT * FROM outbox_events WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT ?",
      limit
    );
    return rows.map(mapOutbox);
  });
}

export async function markSynced(idempotencyKey: string, syncedAt = nowIso()): Promise<void> {
  await runLocalDb(async () => {
    const db = await getDB();
    await db.runAsync(
      "UPDATE outbox_events SET status = 'SYNCED', error_message = NULL, synced_at = ? WHERE idempotency_key = ?",
      syncedAt,
      idempotencyKey
    );
  });
}

export async function markFailed(idempotencyKey: string, errorMessage: string): Promise<void> {
  await runLocalDb(async () => {
    const db = await getDB();
    await db.runAsync(
      "UPDATE outbox_events SET status = 'FAILED', error_message = ? WHERE idempotency_key = ?",
      errorMessage,
      idempotencyKey
    );
  });
}

export async function applySyncResults(results: SyncResult[], syncedAt: string): Promise<void> {
  await runLocalDb(async () => {
    const db = await getDB();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const result of results) {
        if (result.status === "SYNCED" || result.status === "DUPLICATE") {
          await tx.runAsync(
            "UPDATE outbox_events SET status = ?, error_message = NULL, synced_at = ? WHERE idempotency_key = ?",
            result.status,
            syncedAt,
            result.idempotency_key
          );
        } else {
          await tx.runAsync(
            "UPDATE outbox_events SET status = 'FAILED', error_message = ? WHERE idempotency_key = ?",
            result.error ?? "সিঙ্ক করা যায়নি",
            result.idempotency_key
          );
        }
      }
    });
  });
}

export async function getOutboxSummary(): Promise<{
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
}> {
  return runLocalDb(async () => {
    const db = await getDB();
    const pending = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM outbox_events WHERE status = 'PENDING'"
    );
    const failed = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM outbox_events WHERE status = 'FAILED'"
    );
    const lastSync = await db.getFirstAsync<{ value: string | null }>(
      "SELECT value FROM sync_state WHERE key = 'last_synced_at'"
    );
    return {
      pending: pending?.count ?? 0,
      failed: failed?.count ?? 0,
      lastSyncedAt: lastSync?.value ?? null
    };
  });
}

export async function setLastSyncedAt(value: string): Promise<void> {
  await runLocalDb(async () => {
    const db = await getDB();
    await db.runAsync(
      "INSERT INTO sync_state(key, value) VALUES ('last_synced_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      value
    );
  });
}
