import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { copy } from "@/data/stitchCopy.bn";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";

export function MotherDashboard({
  variant = "home",
  week = 24
}: {
  variant?: "home" | "progress";
  week?: number;
}) {
  const title =
    variant === "progress"
      ? `সপ্তাহ ${toBanglaNumber(week)}: আপনার গর্ভকালীন অগ্রগতি`
      : `সপ্তাহ ${toBanglaNumber(week)}: আপনার শিশুর বৃদ্ধি`;
  const body =
    variant === "progress"
      ? "শান্ত থাকুন এবং সাহায্যের জন্য প্রস্তুত থাকুন। কোনো জরুরি লক্ষণ দেখা দিলে দ্রুত স্বাস্থ্যকর্মীকে জানান।"
      : "এই সপ্তাহে পুষ্টিকর খাবার, বিশ্রাম, ও নিয়মিত চেকআপ চালিয়ে যান। কোনো অস্বস্তি হলে স্বাস্থ্যকর্মীকে জানান।";
  const checklist =
    variant === "progress"
      ? ["প্রসব বেদনা যেকোনো সময় শুরু হতে পারে", "শিশুর নড়াচড়া খেয়াল রাখুন", "আপনার হাসপাতাল ব্যাগ প্রস্তুত রাখুন"]
      : [copy.mother.babySize, copy.mother.babyMovement, copy.mother.checkupFood];

  return (
    <ScreenShell>
      <View style={styles.topBar}>
        <Icon name="menu" />
        <View style={styles.brand}>
          <Text style={styles.appName}>{copy.common.appName}</Text>
          <Text style={styles.weekLabel}>সপ্তাহ {toBanglaNumber(week)}</Text>
        </View>
        <Icon name="notifications" />
      </View>

      <View style={styles.progressCard}>
        <View style={styles.weekRow}>
          <Text style={styles.weekTitle}>সপ্তাহ {toBanglaNumber(week)}</Text>
          <Text style={styles.remaining}>আর {toBanglaNumber(Math.max(0, 40 - week))} সপ্তাহ বাকি</Text>
        </View>
        <ProgressBar value={week} max={40} showMarkers />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Icon name="volume-up" color={colors.primary} />
        </View>
        <Text style={styles.label}>{copy.mother.whatToExpect}</Text>
        {checklist.map((item) => (
          <View key={item} style={styles.checkRow}>
            <Icon name="check-circle" color={colors.secondary} size={18} />
            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
        <Text style={styles.body}>{body}</Text>
      </View>

      <View style={styles.grid}>
        <ActionCard icon="monitor-heart" title={copy.mother.healthTips} onPress={() => router.push("/(mother-tabs)/progress")} />
        <ActionCard icon="restaurant-menu" title={copy.mother.nutritionAdvice} onPress={() => router.push("/(mother-tabs)/nutrition")} />
        <ActionCard icon="warning" title={copy.mother.warningSigns} onPress={() => router.push("/(mother-tabs)/chat")} />
        <ActionCard icon="local-hospital" title={copy.mother.emergencyHelp} onPress={() => undefined} />
      </View>

      <Pressable accessibilityLabel={copy.mother.askAi} accessibilityRole="button" style={styles.askCard} onPress={() => router.push("/(mother-tabs)/chat")}>
        <Icon name="chat-bubble" color={colors.onPrimary} />
        <Text style={styles.askText}>{copy.mother.askAi}</Text>
      </Pressable>
    </ScreenShell>
  );
}

function ActionCard({
  icon,
  title,
  onPress
}: {
  icon: "monitor-heart" | "restaurant-menu" | "warning" | "local-hospital";
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={title} accessibilityRole="button" style={styles.actionCard} onPress={onPress}>
      <Icon name={icon} color={colors.primary} />
      <Text style={styles.actionText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  brand: {
    flex: 1
  },
  appName: {
    ...typography.h2,
    color: colors.onSurface
  },
  weekLabel: {
    ...typography.caption,
    color: colors.secondary
  },
  progressCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.base,
    padding: spacing.cardPadding
  },
  weekRow: {
    flexDirection: "row",
    gap: spacing.base,
    justifyContent: "space-between"
  },
  weekTitle: {
    ...typography.h1,
    color: colors.onSurface
  },
  remaining: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.card,
    gap: spacing.sm,
    padding: spacing.cardPadding
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.onSurface,
    flex: 1
  },
  label: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  checkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  checkText: {
    ...typography.body,
    color: colors.onSurface,
    flex: 1
  },
  body: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actionCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    gap: spacing.sm,
    minHeight: 112,
    padding: spacing.base
  },
  actionText: {
    ...typography.label,
    color: colors.onSurface
  },
  askCard: {
    alignItems: "center",
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.base
  },
  askText: {
    ...typography.body,
    color: colors.onPrimary,
    fontFamily: typography.h2.fontFamily
  }
});
