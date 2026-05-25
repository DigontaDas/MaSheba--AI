import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
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
  SUPPLEMENT_GUIDANCE,
  type MonthlyPlan,
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

export default function NutritionScreen() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("সব");
  const [gestationalWeek, setGestationalWeek] = useState(28);

  useEffect(() => {
    getCurrentMotherProfile()
      .then((profile) => {
        if (profile?.gestationalAgeWeeks) {
          setGestationalWeek(profile.gestationalAgeWeeks);
        }
      })
      .catch(() => undefined);
  }, []);

  const plan = useMemo<MonthlyPlan | null>(() => getMonthlyPlan(gestationalWeek), [gestationalWeek]);
  const visibleFoods = useMemo<NutritionFood[]>(() => {
    if (!plan) {
      return [];
    }
    return getFoodsByCategory(plan, activeTab);
  }, [activeTab, plan]);

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
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="মেনু" accessibilityRole="button" onPress={showMenu} style={styles.iconButton}>
          <Icon name="menu" />
        </Pressable>
        <Text style={styles.appName}>{copy.common.appName}</Text>
        <Pressable accessibilityLabel="নোটিফিকেশন" accessibilityRole="button" onPress={showNotifications} style={styles.iconButton}>
          <Icon name="notifications" />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{copy.nutrition.title}</Text>
        {plan ? <Text style={styles.subtitle}>{plan.stage_label_bn}</Text> : null}
      </View>

      <View style={styles.waterCard}>
        <Text style={styles.waterEmoji}>💧</Text>
        <View style={styles.waterText}>
          <Text style={styles.waterTitle}>আজ ৮ গ্লাস পানি পান করুন</Text>
          <Text style={styles.waterSub}>অ্যামনিওটিক তরল বজায় রাখতে হাইড্রেটেড থাকা জরুরি।</Text>
        </View>
      </View>

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

      {plan && activeTab === "সব" ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{plan.app_display_summary_bn}</Text>
        </View>
      ) : null}

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
    gap: spacing.sm
  },
  appName: {
    ...typography.h2,
    color: colors.onSurface,
    flex: 1
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  header: {
    gap: spacing.xs
  },
  title: {
    ...typography.h1,
    color: colors.onSurface
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  waterCard: {
    alignItems: "center",
    backgroundColor: colors.tertiaryFixed,
    borderRadius: radius.card,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.cardPadding
  },
  waterEmoji: {
    fontSize: 28
  },
  waterText: {
    flex: 1
  },
  waterTitle: {
    ...typography.body,
    color: colors.onTertiaryFixed,
    fontFamily: typography.h2.fontFamily
  },
  waterSub: {
    ...typography.caption,
    color: colors.onTertiaryFixed
  },
  tabContent: {
    gap: spacing.sm,
    paddingRight: spacing.base
  },
  tab: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm
  },
  tabActive: {
    backgroundColor: colors.primaryContainer
  },
  tabText: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  tabTextActive: {
    color: colors.onPrimaryContainer
  },
  summaryCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    padding: spacing.base
  },
  summaryText: {
    ...typography.body,
    color: colors.onSurface
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
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
  }
});
