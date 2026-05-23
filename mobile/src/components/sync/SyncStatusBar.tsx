import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";

export function SyncStatusBar({
  pending,
  synced,
  failed,
  loading = false,
  onSync
}: {
  pending: number;
  synced: number;
  failed: number;
  loading?: boolean;
  onSync: () => void;
}) {
  return (
    <View style={styles.bar}>
      <View style={styles.item}>
        <Text style={styles.label}>অপেক্ষমাণ</Text>
        <Text style={styles.value}>{toBanglaNumber(pending)}</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.label}>সিঙ্ক</Text>
        <Text style={styles.value}>{toBanglaNumber(synced)}</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.label}>ব্যর্থ</Text>
        <Text style={styles.value}>{toBanglaNumber(failed)}</Text>
      </View>
      <Pressable accessibilityLabel="সিঙ্ক করুন" accessibilityRole="button" onPress={onSync} disabled={loading} style={styles.button}>
        {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Icon name="sync" color={colors.onPrimary} size={18} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  item: {
    flex: 1,
    gap: spacing.xs
  },
  label: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  value: {
    ...typography.body,
    color: colors.onSurface,
    fontFamily: typography.h2.fontFamily
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44
  }
});
