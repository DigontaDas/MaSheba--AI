import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export function ProgressBar({
  value,
  max,
  label,
  showMarkers = false
}: {
  value: number;
  max: number;
  label?: string;
  showMarkers?: boolean;
}) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      {showMarkers ? (
        <View style={styles.markers}>
          <Text style={styles.marker}>সপ্তাহ ১</Text>
          <Text style={styles.marker}>সপ্তাহ ৪০</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm
  },
  label: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  track: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    height: 12,
    overflow: "hidden"
  },
  fill: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.full,
    height: "100%"
  },
  markers: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  marker: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  }
});
