import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { copy } from "@/data/stitchCopy.bn";
import { SYMPTOM_GUIDANCE } from "@/data/nutritionData";
import { OFFLINE_QA_SEED } from "@/data/offlineQaSeed.bn";
import { clearRoleSession } from "@/auth/roleSession";
import { clearSession } from "@/auth/secureSession";
import { supabase } from "@/auth/supabaseAuth";
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

export default function ShotorkotaScreen() {
  const { t } = useLanguage();
  const [expandedSymptom, setExpandedSymptom] = useState<string | null>(null);
  const [expandedQa, setExpandedQa] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      await Promise.all([clearSession(), clearRoleSession()]);
      router.replace("/(auth)/login");
    }
  };

  const showMenu = () => {
    Alert.alert("মেনু", "", [
      { text: "হোম", onPress: () => router.push("/(mother-tabs)/home") },
      { text: "পুষ্টি", onPress: () => router.push("/(mother-tabs)/nutrition") },
      { text: "প্রোফাইল", onPress: () => router.push("/(mother-tabs)/profile") },
      { text: "লগ আউট", style: "destructive", onPress: handleLogout },
      { text: "বাতিল", style: "cancel" }
    ]);
  };

  const showNotifications = () => {
    Alert.alert("নোটিফিকেশন", "কোনো নতুন নোটিফিকেশন নেই।", [{ text: "ঠিক আছে" }]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Uniform Top Header Bar */}
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="মেনু" accessibilityRole="button" onPress={showMenu} style={styles.iconButton}>
          <Icon name="menu" color="#70605A" size={24} />
        </Pressable>
        <Text style={styles.appName}>{copy.common.appName}</Text>
        <Pressable accessibilityLabel="নোটিফিকেশন" accessibilityRole="button" onPress={showNotifications} style={styles.iconButton}>
          <Icon name="notifications" color="#70605A" size={24} />
        </Pressable>
      </View>

      {/* Header Title Block */}
      <View style={styles.headerTitleBlock}>
        <Text style={styles.title}>{t("nav.shotorkota")}</Text>
      </View>

      {/* Render FAQ/Questionnaire Directly */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Emergency Warning Banner */}
        <View style={styles.faqEmergencyCard}>
          <View style={styles.faqEmergencyHeader}>
            <Icon name="error" color="#B91C1C" size={24} />
            <Text style={styles.faqEmergencyTitle}>জরুরি সতর্কতা</Text>
          </View>
          <Text style={styles.faqEmergencySub}>নিচের যেকোনো লক্ষণ দেখা দিলে এখনই হাসপাতালে যান।</Text>
          <Pressable
            onPress={() => Linking.openURL("tel:16767")}
            style={styles.faqCallButton}
          >
            <Text style={styles.faqCallButtonText}>১৬৭৬৭ কল করুন</Text>
          </Pressable>
        </View>

        {/* Emergency Signs Grid */}
        <View style={styles.faqSection}>
          <Text style={styles.faqSectionTitle}>জরুরি লক্ষণসমূহ</Text>
          <View style={styles.gridContainer}>
            {EMERGENCY_SIGNS.map((sign) => (
              <View key={sign} style={styles.gridCard}>
                <Icon name="warning" color="#D97706" size={16} />
                <Text style={styles.gridCardText}>{sign}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Symptom Accordion list */}
        <View style={styles.faqSection}>
          <Text style={styles.faqSectionTitle}>উপসর্গ অনুযায়ী পরামর্শ</Text>
          {SYMPTOM_GUIDANCE.map((symptom) => {
            const isExpanded = expandedSymptom === symptom.id;
            return (
              <View key={symptom.id} style={styles.accordionContainer}>
                <Pressable
                  onPress={() => setExpandedSymptom(isExpanded ? null : symptom.id)}
                  style={styles.accordionHeader}
                >
                  <Text style={styles.accordionTitle}>{symptom.symptom_bn}</Text>
                  <Icon name={isExpanded ? "expand-less" : "expand-more"} color="#70605A" size={24} />
                </Pressable>
                {isExpanded && (
                  <View style={styles.accordionBody}>
                    {symptom.recommendations.map((recommendation, idx) => (
                      <Text key={idx} style={styles.accordionBulletText}>
                        • {recommendation.bn}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Off-line Q&As */}
        <View style={styles.faqSection}>
          <Text style={styles.faqSectionTitle}>জিজ্ঞাসা ও উত্তর (FAQ)</Text>
          {OFFLINE_QA_SEED.filter((item) => item.severity === "HIGH").slice(0, 6).map((item) => {
            const isExpanded = expandedQa === item.id;
            return (
              <View key={item.id} style={styles.accordionContainer}>
                <Pressable
                  onPress={() => setExpandedQa(isExpanded ? null : item.id)}
                  style={styles.accordionHeader}
                >
                  <Text style={styles.accordionTitle}>{item.question_bn}</Text>
                  <Icon name={isExpanded ? "expand-less" : "expand-more"} color="#70605A" size={24} />
                </Pressable>
                {isExpanded && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.faqAnswerText}>{item.answer_bn}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF9F6"
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3EAE6"
  },
  iconButton: {
    padding: 8,
    borderRadius: 8
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E57A58"
  },
  headerTitleBlock: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#70605A"
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 20
  },

  // FAQ Tab specific premium styling
  faqEmergencyCard: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 10
  },
  faqEmergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  faqEmergencyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#991B1B"
  },
  faqEmergencySub: {
    fontSize: 14,
    color: "#7F1D1D",
    textAlign: "center",
    lineHeight: 20
  },
  faqCallButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 6
  },
  faqCallButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14
  },
  faqSection: {
    gap: 12
  },
  faqSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#70605A",
    marginTop: 8
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  gridCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F3EAE6",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  gridCardText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#70605A",
    flex: 1,
    lineHeight: 16
  },
  accordionContainer: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F3EAE6",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden"
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#70605A",
    flex: 1,
    lineHeight: 20
  },
  accordionBody: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#FFF9F6",
    backgroundColor: "#FFF9F6"
  },
  accordionBulletText: {
    fontSize: 14,
    color: "#70605A",
    lineHeight: 22,
    marginVertical: 4
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#70605A",
    lineHeight: 22
  }
});
