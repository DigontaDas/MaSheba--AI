import { initDB } from "./database";

let initPromise: Promise<void> | null = null;
let queue: Promise<void> = Promise.resolve();

export const localDbFriendlyError = "স্থানীয় তথ্যভান্ডার ব্যস্ত আছে। একটু পরে আবার চেষ্টা করুন।";

export function getLocalDbErrorMessage(error: unknown, fallback = "স্থানীয় তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।"): string {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("database is locked") || message.includes("finalizeasync")) {
    return localDbFriendlyError;
  }
  return fallback;
}

export async function ensureLocalDbReady(): Promise<void> {
  initPromise ??= initDB().catch((error) => {
    initPromise = null;
    throw error;
  });
  return initPromise;
}

export function runLocalDb<T>(operation: () => Promise<T>): Promise<T> {
  const next = queue.then(async () => {
    await ensureLocalDbReady();
    return operation();
  });

  queue = next.then(
    () => undefined,
    () => undefined
  );

  return next;
}
