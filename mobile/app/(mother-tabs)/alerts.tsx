import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmergencyBanner } from "@/components/emergency/EmergencyBanner";
import { OFFLINE_QA_SEED } from "@/data/offlineQaSeed.bn";
import { OFFLINE_QA_SEED_EN } from "@/data/offlineQaSeed.en";
import { SYMPTOM_GUIDANCE } from "@/data/nutritionData";
import { colors, radius, spacing, typography } from "@/theme";
import { useLanguage } from "@/context/LanguageContext";

const EMERGENCY_SIGNS = [
  "অতিরিক্ত রক্তপাত",
  "তীব্র মাথাব্যথা ও চোখে ঝাপসা দেখা",
  "হাত-মুখ অতিরিক্ত ফুলে যাওয়া",
  "শিশুর নড়াচড়া হঠাৎ বন্ধ হয়ে যাওয়া",
  "তীব্র পেটে ব্যথা",
  "জ্বর ১০১°F এর বেশি",
  "খিঁচুনি বা অজ্ঞান হয়ে যাওয়া"
];

const EMERGENCY_SIGNS_EN = [
  "Heavy bleeding",
  "Severe headache and blurred vision",
  "Sudden swelling of hands or face",
  "Baby movement suddenly stops",
  "Severe belly pain",
  "Fever above 101°F",
  "Fits or fainting"
];

export default function AlertsScreen() {
  const { language } = useLanguage();
  const highSeverityItems = (language === "en" ? OFFLINE_QA_SEED_EN : OFFLINE_QA_SEED).filter((item) => item.severity === "HIGH").slice(0, 6);
  const emergencySigns = language === "en" ? EMERGENCY_SIGNS_EN : EMERGENCY_SIGNS;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <EmergencyBanner
        title={language === "en" ? "Emergency warning" : "জরুরি সতর্কতা"}
        message={language === "en" ? "If any of the symptoms below appear, go to a hospital immediately." : "নিচের যেকোনো লক্ষণ দেখা দিলে এখনই হাসপাতালে যান।"}
        actionLabel={language === "en" ? "Call 16767" : "১৬৭৬৭ কল করুন"}
        onAction={() => Linking.openURL("tel:16767")}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{language === "en" ? "Emergency signs" : "জরুরি লক্ষণসমূহ"}</Text>
        {emergencySigns.map((sign) => (
          <View key={sign} style={styles.emergencyItem}>
            <Text style={styles.bullet}>⚠️</Text>
            <Text style={styles.signText}>{sign}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{language === "en" ? "Advice by symptom" : "উপসর্গ অনুযায়ী পরামর্শ"}</Text>
        {SYMPTOM_GUIDANCE.map((symptom) => (
          <View key={symptom.id} style={styles.symptomCard}>
            <Text style={styles.symptomTitle}>{language === "en" ? (symptom as { symptom_en?: string }).symptom_en ?? symptom.symptom_bn : symptom.symptom_bn}</Text>
            {symptom.recommendations.map((recommendation, index) => (
              <Text key={`${symptom.id}-${index}`} style={styles.recText}>
                • {language === "en" ? (recommendation as { en?: string }).en ?? recommendation.bn : recommendation.bn}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{language === "en" ? "Offline emergency questions" : "অফলাইন জরুরি প্রশ্ন"}</Text>
        {highSeverityItems.map((item) => (
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
