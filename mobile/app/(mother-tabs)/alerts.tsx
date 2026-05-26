import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmergencyBanner } from "@/components/emergency/EmergencyBanner";
import { OFFLINE_QA_SEED } from "@/data/offlineQaSeed.bn";
import { SYMPTOM_GUIDANCE } from "@/data/nutritionData";
import { colors, radius, spacing, typography } from "@/theme";

const EMERGENCY_SIGNS = [
  "অতিরিক্ত রক্তপাত",
  "তীব্র মাথাব্যথা ও চোখে ঝাপসা দেখা",
  "হাত-মুখ অতিরিক্ত ফুলে যাওয়া",
  "শিশুর নড়াচড়া হঠাৎ বন্ধ হয়ে যাওয়া",
  "তীব্র পেটে ব্যথা",
  "জ্বর ১০১°F এর বেশি",
  "খিঁচুনি বা অজ্ঞান হয়ে যাওয়া"
];

const HIGH_SEVERITY_ITEMS = OFFLINE_QA_SEED.filter((item) => item.severity === "HIGH").slice(0, 6);

export default function AlertsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <EmergencyBanner
        title="জরুরি সতর্কতা"
        message="নিচের যেকোনো লক্ষণ দেখা দিলে এখনই হাসপাতালে যান।"
        actionLabel="১৬৭৬৭ কল করুন"
        onAction={() => Linking.openURL("tel:16767")}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>জরুরি লক্ষণসমূহ</Text>
        {EMERGENCY_SIGNS.map((sign) => (
          <View key={sign} style={styles.emergencyItem}>
            <Text style={styles.bullet}>⚠️</Text>
            <Text style={styles.signText}>{sign}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>উপসর্গ অনুযায়ী পরামর্শ</Text>
        {SYMPTOM_GUIDANCE.map((symptom) => (
          <View key={symptom.id} style={styles.symptomCard}>
            <Text style={styles.symptomTitle}>{symptom.symptom_bn}</Text>
            {symptom.recommendations.map((recommendation, index) => (
              <Text key={`${symptom.id}-${index}`} style={styles.recText}>
                • {recommendation.bn}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>অফলাইন জরুরি প্রশ্ন</Text>
        {HIGH_SEVERITY_ITEMS.map((item) => (
          <View key={item.id} style={styles.qaCard}>
            <Text style={styles.qaQuestion}>{item.question_bn}</Text>
            <Text style={styles.qaAnswer}>{item.answer_bn}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    gap: spacing.base,
    padding: spacing.marginMobile,
    paddingBottom: spacing.xl
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  emergencyItem: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.base
  },
  bullet: {
    fontSize: 16,
    lineHeight: 22
  },
  signText: {
    ...typography.body,
    color: colors.onSurface,
    flex: 1
  },
  symptomCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.card,
    gap: spacing.xs,
    padding: spacing.cardPadding
  },
  symptomTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontFamily: typography.h2.fontFamily
  },
  recText: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  qaCard: {
    backgroundColor: colors.errorContainer,
    borderRadius: radius.card,
    gap: spacing.xs,
    padding: spacing.base
  },
  qaQuestion: {
    ...typography.body,
    color: colors.onErrorContainer,
    fontFamily: typography.h2.fontFamily
  },
  qaAnswer: {
    ...typography.label,
    color: colors.onErrorContainer
  }
});
