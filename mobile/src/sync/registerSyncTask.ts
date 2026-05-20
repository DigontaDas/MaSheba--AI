import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { OUTBOX_SYNC_TASK } from "./backgroundSync";

export async function registerOutboxSyncTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(OUTBOX_SYNC_TASK);
  if (isRegistered) {
    return;
  }

  await BackgroundTask.registerTaskAsync(OUTBOX_SYNC_TASK, {
    minimumInterval: 15
  });
}
