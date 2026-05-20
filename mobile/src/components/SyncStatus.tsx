import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { getOutboxSummary } from "@/db/outbox";
import { runOutboxSync } from "@/sync/backgroundSync";
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
    refresh();
  }, [refresh]);

  const syncNow = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await runOutboxSync();
      setMessage(result.skipped ? "Sync skipped" : `Processed ${result.processed}`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={compact ? styles.compactContainer : styles.container}>
      <View>
        <Text style={styles.label}>Last synced</Text>
        <Text style={styles.value}>{minutesSince(summary.lastSyncedAt)}</Text>
      </View>
      <View>
        <Text style={styles.label}>Pending</Text>
        <Text style={styles.value}>{summary.pending}</Text>
      </View>
      <View>
        <Text style={styles.label}>Failed</Text>
        <Text style={styles.value}>{summary.failed}</Text>
      </View>
      <Pressable style={styles.button} onPress={syncNow} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sync</Text>}
      </Pressable>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    padding: 16
  },
  compactContainer: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  label: {
    color: "#64748b",
    fontSize: 12
  },
  value: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700"
  },
  button: {
    alignItems: "center",
    backgroundColor: "#047857",
    borderRadius: 6,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700"
  },
  message: {
    color: "#475569",
    width: "100%"
  }
});
