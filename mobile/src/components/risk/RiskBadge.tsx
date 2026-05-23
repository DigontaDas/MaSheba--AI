import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import type { RiskLevel } from "@/types/schema";

const tone = {
  LOW: { backgroundColor: colors.secondaryContainer, color: colors.onSecondaryFixed },
  MODERATE: { backgroundColor: colors.tertiaryFixed, color: colors.onTertiaryFixedVariant },
  HIGH: { backgroundColor: colors.errorContainer, color: colors.onErrorContainer }
} satisfies Record<RiskLevel, { backgroundColor: string; color: string }>;

const label = {
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH"
} satisfies Record<RiskLevel, string>;

export function RiskBadge({ level, compact = false }: { level: RiskLevel; compact?: boolean }) {
  return (
    <View style={[styles.badge, compact && styles.compact, { backgroundColor: tone[level].backgroundColor }]}>
      <Text style={[styles.text, compact && styles.compactText, { color: tone[level].color }]}>
        {label[level]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  compact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },
  text: {
    ...typography.label,
    fontFamily: typography.h2.fontFamily
  },
  compactText: {
    ...typography.caption,
    fontFamily: typography.label.fontFamily
  }
});
