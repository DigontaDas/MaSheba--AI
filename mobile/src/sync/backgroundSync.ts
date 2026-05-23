import * as BackgroundTask from "expo-background-task";
import * as Network from "expo-network";
import * as TaskManager from "expo-task-manager";
import { postSync } from "@/api/syncClient";
import { ensureLocalDbReady } from "@/db/localDbAccess";
import { applySyncResults, getPendingOutbox, setLastSyncedAt } from "@/db/outbox";
import { getSession } from "@/auth/secureSession";

export const OUTBOX_SYNC_TASK = "MAASHEBA_OUTBOX_SYNC";

export async function runOutboxSync(): Promise<{ processed: number; skipped: boolean }> {
  await ensureLocalDbReady();
  const network = await Network.getNetworkStateAsync();
  if (!network.isConnected || network.isInternetReachable === false) {
    return { processed: 0, skipped: true };
  }

  const session = await getSession();
  if (!session) {
    return { processed: 0, skipped: true };
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
