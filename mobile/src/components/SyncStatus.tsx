import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SyncStatusBar } from "./sync/SyncStatusBar";
import { getOutboxSummary } from "@/db/outbox";
import { runOutboxSync } from "@/sync/backgroundSync";
import { colors, spacing, typography } from "@/theme";
import { minutesSince } from "@/utils/time";

type Summary = {
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
};

export function SyncStatus({ compact = false }: { compact?: boolean }) {
  const [summary, setSummary] = useState<Summary>({ pending: 0, failed: 0, lastSyncedAt: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setSummary(await getOutboxSummary());
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const syncNow = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await runOutboxSync();
      setMessage(result.skipped ? "সিঙ্ক অপেক্ষমাণ" : `সিঙ্ক সম্পন্ন: ${result.processed}`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "সিঙ্ক ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={compact ? styles.compact : styles.container}>
      <SyncStatusBar
        pending={summary.pending}
        synced={summary.lastSyncedAt ? 1 : 0}
        failed={summary.failed}
        loading={loading}
        onSync={syncNow}
      />
      {!compact ? <Text style={styles.caption}>সর্বশেষ সিঙ্ক: {minutesSince(summary.lastSyncedAt)}</Text> : null}
      {message ? <Text style={styles.caption}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    padding: spacing.base
  },
  compact: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm
  },
  caption: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  }
});
