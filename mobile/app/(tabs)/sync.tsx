import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNetworkState } from "expo-network";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OfflineStatusPanel } from "@/components/offline/OfflineStatusPanel";
import { SyncStatusBar } from "@/components/sync/SyncStatusBar";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { copy } from "@/data/stitchCopy.bn";
import { getLocalDbErrorMessage } from "@/db/localDbAccess";
import { getOutboxSummary } from "@/db/outbox";
import { runOutboxSync } from "@/sync/backgroundSync";
import { notifyNow } from "@/notifications/notify";
import { colors, radius, spacing, typography } from "@/theme";
import { minutesSince } from "@/utils/time";

type Summary = {
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
};

export default function SyncScreen() {
  const network = useNetworkState();
  const [summary, setSummary] = useState<Summary>({ pending: 0, failed: 0, lastSyncedAt: null });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const offline = network.isConnected === false || network.isInternetReachable === false;

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      setSummary(await getOutboxSummary());
    } catch (loadError) {
      setLoadError(getLocalDbErrorMessage(loadError, copy.sync.loadFailed));
    }
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const syncNow = async () => {
    setLoading(true);
    const count = summary.pending;
    try {
      await runOutboxSync();
      await load();
      notifyNow("✅ সিঙ্ক সম্পন্ন", `${count} টি রেকর্ড সিঙ্ক হয়েছে`, "maasheba-default");
    } catch (syncError) {
      setLoadError(getLocalDbErrorMessage(syncError, copy.sync.syncFailed));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell>
      <OfflineBanner isOffline={offline} pendingCount={summary.pending} />
      {loadError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{copy.common.loadFailed}</Text>
          <Text style={styles.errorText}>{loadError}</Text>
          <PrimaryButton label={copy.common.retry} onPress={load} />
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.title}>{copy.sync.syncStatus}</Text>
        <Text style={styles.subtitle}>{copy.sync.dataSafe}</Text>
      </View>
      <OfflineStatusPanel
        isOffline={offline}
        pendingCount={summary.pending}
        lastSyncedAt={minutesSince(summary.lastSyncedAt)}
        onSync={syncNow}
      />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>আউটবক্স সারাংশ</Text>
        <SyncStatusBar
          pending={summary.pending}
          synced={summary.lastSyncedAt ? 1 : 0}
          failed={summary.failed}
          loading={loading}
          onSync={syncNow}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs
  },
  title: {
    ...typography.h1,
    color: colors.onSurface
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.base,
    padding: spacing.cardPadding
  },
  cardTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  errorCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.cardPadding
  },
  errorTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  errorText: {
    ...typography.body,
    color: colors.onSurfaceVariant
  }
});
