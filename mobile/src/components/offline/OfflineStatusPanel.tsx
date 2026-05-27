import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { useCopy } from "@/data/useCopy";
import { colors, radius, spacing, typography } from "@/theme";
import { formatNumber } from "@/utils/localizedFormat";

export function OfflineStatusPanel({
  isOffline,
  pendingCount,
  lastSyncedAt,
  onSync
}: {
  isOffline: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  onSync: () => void;
}) {
  const { language } = useLanguage();
  const copy = useCopy();

  return (
    <View style={styles.panel}>
      <View style={styles.heroIcon}>
        <Icon name={isOffline ? "phonelink-erase" : "cloud-done"} color={colors.primary} size={36} />
      </View>
      <Text style={styles.title}>{copy.sync.offlineWorks}</Text>
      <Text style={styles.body}>{copy.sync.dataSafe}</Text>
      <View style={styles.row}>
        <InfoPill icon="favorite" label={copy.sync.localAi} />
        <InfoPill icon="lock" label={copy.sync.saved} />
        <InfoPill icon="sync" label={copy.sync.syncWhenOnline} />
      </View>
      <View style={styles.status}>
        <Text style={styles.statusTitle}>{copy.sync.syncStatus}</Text>
        <Text style={styles.statusValue}>
          {copy.sync.waiting} • {formatNumber(pendingCount, language)}
        </Text>
        <Text style={styles.caption}>{lastSyncedAt ?? copy.sync.waitingRecords}</Text>
      </View>
      <Pressable accessibilityLabel={copy.common.sync} accessibilityRole="button" onPress={onSync} style={styles.button}>
        <Icon name="sync" color={colors.onPrimary} size={18} />
        <Text style={styles.buttonText}>{copy.common.sync}</Text>
      </Pressable>
    </View>
  );
}

function InfoPill({ icon, label }: { icon: "favorite" | "lock" | "sync"; label: string }) {
  return (
    <View style={styles.pill}>
      <Icon name={icon} color={colors.secondary} size={18} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.base,
    padding: spacing.cardPadding
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.full,
    height: 84,
    justifyContent: "center",
    width: 84
  },
  title: {
    ...typography.h1,
    color: colors.onSurface,
    textAlign: "center"
  },
  body: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center"
  },
  pill: {
    alignItems: "center",
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  pillText: {
    ...typography.caption,
    color: colors.onSecondaryFixed
  },
  status: {
    alignSelf: "stretch",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    gap: spacing.xs,
    padding: spacing.base
  },
  statusTitle: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  statusValue: {
    ...typography.h2,
    color: colors.onSurface
  },
  caption: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: spacing.lg
  },
  buttonText: {
    ...typography.label,
    color: colors.onPrimary,
    fontFamily: typography.h2.fontFamily
  }
});
