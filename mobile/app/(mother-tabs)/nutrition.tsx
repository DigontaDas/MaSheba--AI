import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { NutritionCard } from "@/components/nutrition/NutritionCard";
import { Icon } from "@/components/ui/Icon";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { clearRoleSession, getCurrentMotherProfile } from "@/auth/roleSession";
import { clearSession } from "@/auth/secureSession";
import { supabase } from "@/auth/supabaseAuth";
import { copy } from "@/data/stitchCopy.bn";
import { getFoodImage } from "@/data/foodImageMap";
import {
  getFoodsByCategory,
  getMonthlyPlan,
  prioritizeFoodsByRisk,
  RISK_NUTRITION_OVERLAY,
  SUPPLEMENT_GUIDANCE,
  type MonthlyPlan,
  type NutritionRiskLevel,
  type NutritionFood
} from "@/data/nutritionData";
import { colors, radius, spacing, typography } from "@/theme";

const TABS = ["সব", "খাবার", "পানীয়", "ওষুধ", "বিশ্রাম"] as const;

function nutrientLabel(nutrient?: string): string {
  switch (nutrient) {
    case "protein":
      return "প্রোটিন";
    case "iron":
      return "আয়রন";
    case "calcium":
      return "ক্যালসিয়াম";
    case "energy":
      return "শক্তি";
    case "hydration":
      return "পানি";
    case "folate":
      return "ফোলেট";
    default:
      return "পুষ্টি";
  }
}

const toBengaliNumeral = (num: number): string => {
  const numerals: Record<string, string> = {
    "0": "০",
    "1": "১",
    "2": "২",
    "3": "৩",
    "4": "৪",
    "5": "৫",
    "6": "৬",
    "7": "৭",
    "8": "৮",
    "9": "৯"
  };
  return num.toString().split("").map((char) => numerals[char] || char).join("");
};

export default function NutritionScreen() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("সব");
  const [gestationalWeek, setGestationalWeek] = useState(32); // Default to 32 (Month 8) matching mockup
  const [waterGlasses, setWaterGlasses] = useState(0); // Starts at 0 matching request
  const [riskLevel, setRiskLevel] = useState<NutritionRiskLevel>("LOW");

  useEffect(() => {
    const loadWaterData = async () => {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const savedDate = await SecureStore.getItemAsync("water_tracking_date");
        const savedGlasses = await SecureStore.getItemAsync("water_tracking_count");

        if (savedDate === todayStr && savedGlasses) {
          setWaterGlasses(parseInt(savedGlasses, 10));
        } else {
          await SecureStore.setItemAsync("water_tracking_date", todayStr);
          await SecureStore.setItemAsync("water_tracking_count", "0");
          setWaterGlasses(0);
        }
      } catch (err) {
        console.warn("Error loading water progress:", err);
      }
    };

    loadWaterData();

    getCurrentMotherProfile()
      .then((profile) => {
        if (profile?.gestationalAgeWeeks) {
          setGestationalWeek(profile.gestationalAgeWeeks);
        }
        if (profile?.patientId) {
          void (async () => {
            const { data } = await supabase
              .from("patients")
              .select("last_risk_level")
              .eq("id", profile.patientId)
              .maybeSingle<{ last_risk_level: NutritionRiskLevel }>();
            if (data?.last_risk_level) setRiskLevel(data.last_risk_level);
          })().catch(() => undefined);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleWaterIncrement = async () => {
    if (waterGlasses < 8) {
      const newCount = waterGlasses + 1;
      setWaterGlasses(newCount);
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        await SecureStore.setItemAsync("water_tracking_date", todayStr);
        await SecureStore.setItemAsync("water_tracking_count", newCount.toString());
      } catch (err) {
        console.warn("Error saving water progress:", err);
      }
    }
  };

  const plan = useMemo<MonthlyPlan | null>(() => getMonthlyPlan(gestationalWeek), [gestationalWeek]);
  const visibleFoods = useMemo<NutritionFood[]>(() => {
    if (!plan) {
      return [];
    }
    const filtered = getFoodsByCategory(plan, activeTab);
    return prioritizeFoodsByRisk(filtered, riskLevel);
  }, [activeTab, plan, riskLevel]);
  const riskOverlay = RISK_NUTRITION_OVERLAY[riskLevel];

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
      { text: "প্রোফাইল", onPress: () => router.push("/(mother-tabs)/profile") },
      { text: "লগ আউট", style: "destructive", onPress: handleLogout },
      { text: "বাতিল", style: "cancel" }
    ]);
  };

  const showNotifications = () => {
    Alert.alert("নোটিফিকেশন", "কোনো নতুন নোটিফিকেশন নেই।", [{ text: "ঠিক আছে" }]);
  };

  const showFoodInfo = (food: NutritionFood) => {
    const substitutions = food.substitutions_bn?.length ? `\nবিকল্প: ${food.substitutions_bn.join(", ")}` : "";
    const caution = food.caution_bn ? `\nসতর্কতা: ${food.caution_bn}` : "";
    Alert.alert(food.name_bn, `${food.amount_bn}\n${nutrientLabel(food.nutrient_focus[0])}${substitutions}${caution}`, [{ text: "ঠিক আছে" }]);
  };

  return (
    <ScreenShell>
      {/* Top Header Bar */}
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
      <View style={styles.header}>
        <Text style={styles.title}>{copy.nutrition.title}</Text>
        {plan ? <Text style={styles.subtitle}>{plan.stage_label_bn}</Text> : null}
      </View>

      {/* Interactive Stateful Water Intake Card */}
      <View style={styles.waterCard}>
        <View style={styles.waterHeaderRow}>
          <Text style={styles.waterTitle}>আজ ৮ গ্লাস পানি পান করুন</Text>
          <View style={styles.waterBadge}>
            <Text style={styles.waterBadgeText}>{toBengaliNumeral(waterGlasses)}/৮</Text>
          </View>
        </View>

        <Text style={waterGlasses === 8 ? styles.waterSubCompleted : styles.waterSub}>
          {waterGlasses === 8
            ? "🎉 অভিনন্দন! আজকের লক্ষ্য সম্পূর্ণ হয়েছে! আপনি দারুণ করেছেন।"
            : "অ্যামনিওটিক তরল বজায় রাখতে হাইড্রেটেড থাকা জরুরি।"}
        </Text>

        <View style={styles.glassesRow}>
          {Array.from({ length: 8 }).map((_, index) => {
            const isFilled = index < waterGlasses;
            return (
              <Pressable
                key={index}
                onPress={handleWaterIncrement}
                style={[
                  styles.glassTumbler,
                  isFilled ? styles.glassFilled : styles.glassEmpty
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Scrollable Badges Category Bar */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          {TABS.map((tab) => (
            <Pressable
              accessibilityLabel={tab}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === tab }}
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Summary Guidelines Card */}
      {plan && activeTab === "সব" ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{plan.app_display_summary_bn}</Text>
        </View>
      ) : null}

      {riskLevel !== "LOW" && riskOverlay.alert_bn ? (
        <View style={[styles.riskAlert, riskLevel === "HIGH" ? styles.riskHigh : styles.riskModerate]}>
          <View style={styles.riskHeader}>
            <Icon name="warning" color={riskLevel === "HIGH" ? "#B3261E" : "#8A5A00"} size={20} />
            <Text style={styles.riskTitle}>{riskOverlay.title_bn}</Text>
          </View>
          <Text style={styles.riskBody}>{riskOverlay.alert_bn}</Text>
          {riskOverlay.extra_foods_bn.map((food) => (
            <Text key={food} style={styles.riskFoodItem}>✓ {food}</Text>
          ))}
          {riskOverlay.avoid_bn.length ? (
            <View style={styles.avoidBlock}>
              <Text style={styles.avoidTitle}>এড়িয়ে চলুন:</Text>
              {riskOverlay.avoid_bn.map((item) => (
                <Text key={item} style={styles.avoidItem}>× {item}</Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Recommended Food Grid */}
      {activeTab !== "ওষুধ" && activeTab !== "বিশ্রাম" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>প্রস্তাবিত খাবার</Text>
          <View style={styles.grid}>
            {visibleFoods.map((food) => (
              <NutritionCard
                key={food.id}
                imageSource={getFoodImage(food.name_bn, food.name_en) ?? undefined}
                onPress={() => showFoodInfo(food)}
                subtitle={food.amount_bn}
                tag={nutrientLabel(food.nutrient_focus[0])}
                title={food.name_bn}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* Supplements Tab content */}
      {activeTab === "ওষুধ" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>সাপ্লিমেন্ট</Text>
          {SUPPLEMENT_GUIDANCE.map((supplement) => (
            <View key={supplement.id} style={styles.supplementCard}>
              <Text style={styles.suppName}>{supplement.name_bn}</Text>
              <Text style={styles.suppBody}>{supplement.dose_bn}</Text>
              <Text style={styles.suppTiming}>⏰ {supplement.timing_bn}</Text>
              {supplement.side_effects_bn ? (
                <Text style={styles.suppSideEffect}>⚠️ {supplement.side_effects_bn}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* Rest Tab content */}
      {activeTab === "বিশ্রাম" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>বিশ্রামের পরামর্শ</Text>
          {[
            "দিনে কমপক্ষে ৮ ঘণ্টা ঘুমান।",
            "বাম পাশে শুয়ে ঘুমানো ভালো — এতে রক্তচলাচল ভালো হয়।",
            "ভারী কাজ এড়িয়ে চলুন, বিশেষ করে শেষ তিন মাসে।",
            "প্রতি ১-২ ঘণ্টা পর পর উঠে একটু হাঁটুন।",
            "মানসিক চাপ কমাতে পরিবারের সাথে কথা বলুন।"
          ].map((tip) => (
            <View key={tip} style={styles.restTip}>
              <Text style={styles.restTipText}>✓ {tip}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Cautions section */}
      {plan?.cautions_bn?.length ? (
        <View style={styles.cautionSection}>
          <Text style={styles.cautionTitle}>⚠️ সতর্কতা</Text>
          {plan.cautions_bn.map((caution) => (
            <Text key={caution} style={styles.cautionText}>
              • {caution}
            </Text>
          ))}
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    backgroundColor: "#FFF9F6"
  },
  appName: {
    ...typography.h2,
    color: "#70605A",
    textAlign: "center",
    fontWeight: "bold",
    flex: 1
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FCEBE5"
  },
  header: {
    gap: spacing.xs,
    marginVertical: 4
  },
  title: {
    ...typography.h1,
    color: "#4A3E39",
    fontWeight: "bold",
    fontSize: 28
  },
  subtitle: {
    ...typography.body,
    color: "#E57A58",
    fontWeight: "600",
    fontSize: 16,
    marginTop: 2
  },
  waterCard: {
    backgroundColor: "#CBE5F5",
    borderRadius: 18,
    padding: 16,
    gap: 0
  },
  waterHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  waterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F375A"
  },
  waterBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center"
  },
  waterBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#405C6A"
  },
  waterSub: {
    fontSize: 14,
    color: "#2E4C6D",
    lineHeight: 20,
    marginTop: 6
  },
  waterSubCompleted: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "bold",
    lineHeight: 20,
    marginTop: 6
  },
  glassesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    width: "100%"
  },
  glassTumbler: {
    width: "10.5%",
    aspectRatio: 0.65,
    borderRadius: 8
  },
  glassFilled: {
    backgroundColor: "#405C6A"
  },
  glassEmpty: {
    backgroundColor: "#A6D2EE",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#8FBDDB"
  },
  tabContent: {
    gap: spacing.xs,
    paddingRight: spacing.base
  },
  tab: {
    backgroundColor: "#FCEBE5",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  tabActive: {
    backgroundColor: "#E57A58"
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#70605A"
  },
  tabTextActive: {
    color: "#FFFFFF"
  },
  summaryCard: {
    backgroundColor: "#FFF5F2",
    borderLeftColor: "#E57A58",
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
    marginVertical: 2
  },
  summaryText: {
    fontSize: 14,
    color: "#70605A",
    lineHeight: 22,
    fontWeight: "500"
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    ...typography.h2,
    color: "#4A3E39",
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 8
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
    columnGap: 10,
    paddingBottom: 16
  },
  supplementCard: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.card,
    gap: spacing.xs,
    padding: spacing.cardPadding
  },
  suppName: {
    ...typography.h2,
    color: colors.onSecondaryContainer
  },
  suppBody: {
    ...typography.body,
    color: colors.onSecondaryContainer
  },
  suppTiming: {
    ...typography.label,
    color: colors.secondary
  },
  suppSideEffect: {
    ...typography.caption,
    color: colors.error
  },
  restTip: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    padding: spacing.base
  },
  restTipText: {
    ...typography.body,
    color: colors.onSurface
  },
  cautionSection: {
    backgroundColor: colors.errorContainer,
    borderRadius: radius.card,
    gap: spacing.xs,
    padding: spacing.base
  },
  cautionTitle: {
    ...typography.label,
    color: colors.onErrorContainer,
    fontFamily: typography.h2.fontFamily
  },
  cautionText: {
    ...typography.caption,
    color: colors.onErrorContainer
  },
  riskAlert: {
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.cardPadding
  },
  riskHigh: {
    backgroundColor: "#FCEBE5",
    borderColor: "#F2B8B5"
  },
  riskModerate: {
    backgroundColor: "#FFF4D6",
    borderColor: "#E8D18A"
  },
  riskHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  riskTitle: {
    ...typography.label,
    color: "#4A3E39",
    flex: 1,
    fontFamily: typography.h2.fontFamily
  },
  riskBody: {
    ...typography.body,
    color: "#70605A"
  },
  riskFoodItem: {
    ...typography.label,
    color: "#4A6047"
  },
  avoidBlock: {
    gap: 2,
    marginTop: spacing.xs
  },
  avoidTitle: {
    ...typography.label,
    color: "#8A3A2A",
    fontFamily: typography.h2.fontFamily
  },
  avoidItem: {
    ...typography.caption,
    color: "#8A3A2A"
  }
});
