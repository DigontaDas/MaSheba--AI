import * as BackgroundTask from "expo-background-task";
import * as Network from "expo-network";
import * as TaskManager from "expo-task-manager";
import { postSync } from "@/api/syncClient";
import { ensureLocalDbReady } from "@/db/localDbAccess";
import { applySyncResults, getPendingOutbox, setLastSyncedAt } from "@/db/outbox";
import { getSession, isTokenExpired, refreshAndSaveSession } from "@/auth/secureSession";

export const OUTBOX_SYNC_TASK = "MAASHEBA_OUTBOX_SYNC";

export async function runOutboxSync(): Promise<{ processed: number; skipped: boolean }> {
  await ensureLocalDbReady();
  const network = await Network.getNetworkStateAsync();
  if (!network.isConnected || network.isInternetReachable === false) {
    return { processed: 0, skipped: true };
  }

  let session = await getSession();
  if (!session) {
    return { processed: 0, skipped: true };
  }

  // Skip sync entirely for demo/offline mode — mock tokens are rejected by the backend with 401
  if (session.accessToken === "mock-access-token" || session.accessToken === "offline-access-token") {
    return { processed: 0, skipped: true };
  }

  // Defensively check if the accessToken is expired or close to expiry, and refresh it
  if (isTokenExpired(session.accessToken)) {
    const refreshed = await refreshAndSaveSession(session.refreshToken);
    if (!refreshed) {
      return { processed: 0, skipped: true }; // Require manual app launch to establish session
    }
    session = refreshed;
  }

  const pending = await getPendingOutbox(100);
  if (pending.length === 0) {
    return { processed: 0, skipped: false };
  }

  const response = await postSync(pending, session.accessToken);
  await applySyncResults(response.results, response.synced_at);
  await setLastSyncedAt(response.synced_at);
  return { processed: response.results.length, skipped: false };
}

TaskManager.defineTask(OUTBOX_SYNC_TASK, async () => {
  try {
    await runOutboxSync();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});
