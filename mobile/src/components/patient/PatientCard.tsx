import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import type { Patient, RiskLevel } from "@/types/schema";

export function PatientCard({
  patient,
  riskLevel,
  nextAction,
  onPress
}: {
  patient: Patient;
  riskLevel: RiskLevel;
  nextAction?: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.body}>
        <RiskBadge level={riskLevel} compact />
        <Text style={styles.name}>{patient.name}</Text>
        <Text style={styles.meta}>
          গর্ভাবস্থা: {toBanglaNumber(patient.gestational_age_weeks)} সপ্তাহ
        </Text>
        {nextAction ? <Text style={styles.action}>{nextAction}</Text> : null}
      </View>
      <Icon name="chevron-right" color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 106,
    padding: spacing.cardPadding
  },
  pressed: {
    backgroundColor: colors.surfaceContainerLow
  },
  body: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0
  },
  name: {
    ...typography.body,
    color: colors.onSurface,
    fontFamily: typography.h2.fontFamily
  },
  meta: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  action: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: typography.label.fontFamily
  }
});
