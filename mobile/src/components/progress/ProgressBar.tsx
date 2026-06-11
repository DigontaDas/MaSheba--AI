import { StyleSheet, Text, View } from "react-native";
import { useCopy } from "@/data/useCopy";
import { colors, fontFamily, radius, spacing, typography } from "@/theme";

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
  const copy = useCopy();
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ now: percent, min: 0, max: 100 }} style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      {showMarkers ? (
        <View style={styles.markers}>
          <Text style={styles.marker}>{copy.mother.week1}</Text>
          <Text style={styles.marker}>{copy.mother.week40}</Text>
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
    fontFamily: undefined,
    fontWeight: "bold",
    fontSize: 13,
    color: colors.onSurface
  }
});
