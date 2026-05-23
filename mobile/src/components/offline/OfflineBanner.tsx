import { StyleSheet, Text, View } from "react-native";
import { useNetworkState } from "expo-network";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/data/stitchCopy.bn";
import { colors, radius, spacing, typography } from "@/theme";

export function OfflineBanner({
  isOffline,
  pendingCount
}: {
  isOffline?: boolean;
  pendingCount?: number;
}) {
  const network = useNetworkState();
  const offline = isOffline ?? (network.isConnected === false || network.isInternetReachable === false);

  if (!offline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Icon name="wifi-off" color={colors.onSecondaryFixedVariant} size={18} />
      <Text style={styles.text}>
        {copy.common.offlineNotice}
        {pendingCount ? ` • ${pendingCount}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.secondaryContainer,
    borderColor: colors.secondaryFixedDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm
  },
  text: {
    ...typography.label,
    color: colors.onSecondaryFixed,
    flex: 1
  }
});
