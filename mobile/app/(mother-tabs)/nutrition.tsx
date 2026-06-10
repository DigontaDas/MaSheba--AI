import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { NutritionCard } from "@/components/nutrition/NutritionCard";
import { Icon } from "@/components/ui/Icon";
import { MenuModal } from "@/components/ui/MenuModal";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { clearRoleSession, getCurrentMotherProfile } from "@/auth/roleSession";
import { clearSession } from "@/auth/secureSession";
import { supabase } from "@/auth/supabaseAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useCopy } from "@/data/useCopy";
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
import { formatNumber } from "@/utils/localizedFormat";
import { scheduleReminder } from "@/notifications/notify";

const TABS = [
  { id: "all", copyKey: "all" },
  { id: "food", copyKey: "food" },
  { id: "drinks", copyKey: "drinks" },
  { id: "medicine", copyKey: "medicine" },
  { id: "rest", copyKey: "rest" }
] as const;

type TabId = (typeof TABS)[number]["id"];

function nutrientLabel(nutrient: string | undefined, language: "bn" | "en"): string {
  if (language === "en") {
    switch (nutrient) {
      case "protein":
        return "Protein";
      case "iron":
        return "Iron";
      case "calcium":
        return "Calcium";
      case "energy":
        return "Energy";
      case "hydration":
        return "Water";
      case "folate":
        return "Folate";
      default:
        return "Nutrition";
    }
  }
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
  const { language } = useLanguage();
  const copy = useCopy();
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [gestationalWeek, setGestationalWeek] = useState(32); // Default to 32 (Month 8) matching mockup
  const [waterGlasses, setWaterGlasses] = useState(0); // Starts at 0 matching request
  const [riskLevel, setRiskLevel] = useState<NutritionRiskLevel>("LOW");

  const [checklist, setChecklist] = useState({
    iron: false,
    calcium: false,
    protein: false,
    greens: false,
    milkEgg: false,
    water: false,
    fruits: false
  });

  useEffect(() => {
    const loadDailyProgress = async () => {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        
        // 1. Water Intake loading
        const savedWaterDate = await SecureStore.getItemAsync("water_tracking_date");
        const savedGlasses = await SecureStore.getItemAsync("water_tracking_count");
        let currentGlasses = 0;
        if (savedWaterDate === todayStr && savedGlasses) {
          currentGlasses = parseInt(savedGlasses, 10);
          setWaterGlasses(currentGlasses);
        } else {
          await SecureStore.setItemAsync("water_tracking_date", todayStr);
          await SecureStore.setItemAsync("water_tracking_count", "0");
          setWaterGlasses(0);
        }

        // 2. Nutrition Checklist loading
        const savedChecklistDate = await SecureStore.getItemAsync("nutrition_checklist_date");
        const savedChecklist = await SecureStore.getItemAsync("nutrition_checklist_state");
        if (savedChecklistDate === todayStr && savedChecklist) {
          setChecklist(JSON.parse(savedChecklist));
        } else {
          await SecureStore.setItemAsync("nutrition_checklist_date", todayStr);
          const initialChecklist = {
            iron: false,
            calcium: false,
            protein: false,
            greens: false,
            milkEgg: false,
            water: currentGlasses === 8,
            fruits: false
          };
          await SecureStore.setItemAsync("nutrition_checklist_state", JSON.stringify(initialChecklist));
          setChecklist(initialChecklist);
        }
      } catch (_err) {
        // console.warn("Error loading daily progress:", _err)
      }
    };

    loadDailyProgress();

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

    // Schedule water reminders (10:00, 14:00, 18:00)
    scheduleReminder("পানি 8 গ্লাস খেয়েছেন?", "আজকের পানি ট্র্যাকার আপডেট করুন", 10, 0);
    scheduleReminder("পানি 8 গ্লাস খেয়েছেন?", "আজকের পানি ট্র্যাকার আপডেট করুন", 14, 0);
    scheduleReminder("পানি 8 গ্লাস খেয়েছেন?", "আজকের পানি ট্র্যাকার আপডেট করুন", 18, 0);

    // Schedule nutrition reminder (09:00)
    scheduleReminder("🥗 পুষ্টিকর খাবার", "আজকের পুষ্টি চেকলিস্ট দেখুন", 9, 0);
  }, []);

  // Auto-sync water checklist item when glasses count changes
  useEffect(() => {
    const syncWaterCheck = async () => {
      const isWaterDone = waterGlasses === 8;
      if (checklist.water !== isWaterDone) {
        const updated = { ...checklist, water: isWaterDone };
        setChecklist(updated);
        try {
          await SecureStore.setItemAsync("nutrition_checklist_state", JSON.stringify(updated));
        } catch (_e) {
          // console.warn("Failed to sync water check state:", _e)
        }
      }
    };
    syncWaterCheck();
  }, [waterGlasses]);

  const handleToggleChecklist = async (key: keyof typeof checklist) => {
    const updated = {
      ...checklist,
      [key]: !checklist[key]
    };
    setChecklist(updated);
    try {
      await SecureStore.setItemAsync("nutrition_checklist_state", JSON.stringify(updated));
    } catch (_err) {
      // console.warn("Error saving checklist:", _err)
    }
  };

  const handleWaterIncrement = async () => {
    if (waterGlasses < 8) {
      const newCount = waterGlasses + 1;
      setWaterGlasses(newCount);
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        await SecureStore.setItemAsync("water_tracking_date", todayStr);
        await SecureStore.setItemAsync("water_tracking_count", newCount.toString());
      } catch (_err) {
        // console.warn("Error saving water progress:", _err)
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

  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      await Promise.all([clearSession(), clearRoleSession()]);
      router.replace("/(auth)/login");
    }
  };

  const showMenu = () => {
    setMenuVisible(true);
  };

  const showNotifications = () => {
    Alert.alert(language === "en" ? "Notifications" : "নোটিফিকেশন", language === "en" ? "No new notifications." : "কোনো নতুন নোটিফিকেশন নেই।", [
      { text: language === "en" ? "OK" : "ঠিক আছে" }
    ]);
  };

  const showFoodInfo = (food: NutritionFood) => {
    const substitutions =
      language === "en"
        ? food.substitutions_en?.length
          ? `\nAlternatives: ${food.substitutions_en.join(", ")}`
          : ""
        : food.substitutions_bn?.length
          ? `\nবিকল্প: ${food.substitutions_bn.join(", ")}`
          : "";
    const caution =
      language === "en" ? (food.caution_en ? `\nCaution: ${food.caution_en}` : "") : food.caution_bn ? `\nসতর্কতা: ${food.caution_bn}` : "";
    Alert.alert(
      language === "en" ? food.name_en : food.name_bn,
      `${language === "en" ? food.amount_en ?? food.amount_bn : food.amount_bn}\n${nutrientLabel(food.nutrient_focus[0], language)}${substitutions}${caution}`,
      [{ text: language === "en" ? "OK" : "ঠিক আছে" }]
    );
  };

  return (
    <ScreenShell>
      <MenuModal 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onLogout={handleLogout} 
      />
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <Pressable accessibilityLabel={language === "en" ? "Menu" : "মেনু"} accessibilityRole="button" onPress={showMenu} style={styles.iconButton}>
          <Icon name="menu" color="#70605A" size={24} />
        </Pressable>
        <Text style={styles.appName}>{copy.common.appName}</Text>
        <Pressable accessibilityLabel={language === "en" ? "Notifications" : "নোটিফিকেশন"} accessibilityRole="button" onPress={showNotifications} style={styles.iconButton}>
          <Icon name="notifications" color="#70605A" size={24} />
        </Pressable>
      </View>

      {/* Header Title Block */}
      <View style={styles.header}>
        <Text style={styles.title}>{copy.nutrition.title}</Text>
        {plan ? <Text style={styles.subtitle}>{language === "en" ? plan.stage_label_en ?? plan.stage_label_bn : plan.stage_label_bn}</Text> : null}
      </View>

      {/* Interactive Stateful Water Intake Card */}
      <View style={styles.waterCard}>
        <View style={styles.waterHeaderRow}>
          <Text style={styles.waterTitle}>{copy.nutrition.water}</Text>
          <View style={styles.waterBadge}>
            <Text style={styles.waterBadgeText}>{formatNumber(waterGlasses, language)}/{formatNumber(8, language)}</Text>
          </View>
        </View>

        <Text style={waterGlasses === 8 ? styles.waterSubCompleted : styles.waterSub}>
          {waterGlasses === 8
            ? language === "en"
              ? "Today's water goal is complete."
              : "অভিনন্দন! আজকের লক্ষ্য সম্পূর্ণ হয়েছে! আপনি দারুণ করেছেন।"
            : copy.nutrition.waterDescription}
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

      {/* Daily Nutrition Checklist Component */}
      <View style={styles.checklistCard}>
        <View style={styles.checklistHeaderRow}>
          <Text style={styles.checklistTitle}>{language === "en" ? "Today's nutrition checklist" : "আজকের পুষ্টি চেকলিস্ট"}</Text>
          <View style={styles.checklistScoreBadge}>
            <Text style={styles.checklistScoreText}>
              {formatNumber(Object.values(checklist).filter(Boolean).length, language)}/{formatNumber(7, language)}
            </Text>
          </View>
        </View>

        <Text style={Object.values(checklist).every(Boolean) ? styles.checklistCompletedText : styles.checklistSubText}>
          {Object.values(checklist).every(Boolean)
            ? language === "en"
              ? "Today's balanced nutrition checklist is complete."
              : "চমৎকার! আজকের সুষম পুষ্টি সম্পূর্ণ হয়েছে! আপনি সেরা যত্ন নিচ্ছেন।"
            : language === "en"
              ? "For a healthy pregnancy, confirm the foods and supplements below each day."
              : "সুস্থ গর্ভাবস্থার জন্য প্রতিদিন নিচের খাবার ও ওষুধগুলো নিশ্চিত করুন।"}
        </Text>

        {/* Dynamic Progress Bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(Object.values(checklist).filter(Boolean).length / 7) * 100}%` }
            ]}
          />
        </View>

        {/* Checklist Items */}
        <View style={styles.checklistItemsList}>
          {[
            { key: "iron", label: language === "en" ? "Iron and folic acid tablet" : "আয়রন ও ফলিক এসিড ওষুধ" },
            { key: "calcium", label: language === "en" ? "Calcium tablet" : "ক্যালসিয়াম ওষুধ" },
            { key: "protein", label: language === "en" ? "Lentils and protein-rich food (fish/meat)" : "মসুর ডাল ও প্রোটিন সমৃদ্ধ খাবার (মাছ/মাংস)" },
            { key: "greens", label: language === "en" ? "Green leafy vegetables" : "সবুজ শাকসবজি" },
            { key: "milkEgg", label: language === "en" ? "Milk and egg" : "দুধ ও ডিম" },
            {
              key: "water",
              label: language === "en" ? "Safe water (8 glasses)" : "বিশুদ্ধ পানি (৮ গ্লাস)",
              disabled: true,
              note: language === "en" ? "(Auto-checked when the water tracker is complete)" : "(পানি ট্র্যাকার পূরণ হলে অটো-চেক হবে)"
            },
            { key: "fruits", label: language === "en" ? "Seasonal fruits" : "মৌসুমী ফলমূল" }
          ].map((item) => {
            const isChecked = checklist[item.key as keyof typeof checklist];
            const isDisabled = item.disabled;
            return (
              <Pressable
                key={item.key}
                disabled={isDisabled}
                onPress={() => handleToggleChecklist(item.key as keyof typeof checklist)}
                style={styles.checkItemRow}
              >
                <View style={[styles.checkBoxCircle, isChecked && styles.checkBoxCircleFilled]}>
                  {isChecked && <Icon name="check" color="#FFFFFF" size={14} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkItemLabel, isChecked && styles.checkItemLabelChecked]}>
                    {item.label}
                  </Text>
                  {item.note && <Text style={styles.checkItemNote}>{item.note}</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Scrollable Badges Category Bar */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          {TABS.map((tab) => (
            <Pressable
              accessibilityLabel={copy.nutrition[tab.copyKey]}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === tab.id }}
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{copy.nutrition[tab.copyKey]}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Summary Guidelines Card */}
      {plan && activeTab === "all" ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{language === "en" ? plan.app_display_summary_en ?? plan.app_display_summary_bn : plan.app_display_summary_bn}</Text>
        </View>
      ) : null}

      {riskLevel !== "LOW" && (language === "en" ? riskOverlay.alert_en : riskOverlay.alert_bn) ? (
        <View style={[styles.riskAlert, riskLevel === "HIGH" ? styles.riskHigh : styles.riskModerate]}>
          <View style={styles.riskHeader}>
            <Icon name="warning" color={riskLevel === "HIGH" ? "#B3261E" : "#8A5A00"} size={20} />
            <Text style={styles.riskTitle}>{language === "en" ? riskOverlay.title_en : riskOverlay.title_bn}</Text>
          </View>
          <Text style={styles.riskBody}>{language === "en" ? riskOverlay.alert_en : riskOverlay.alert_bn}</Text>
          {(language === "en" ? riskOverlay.extra_foods_en : riskOverlay.extra_foods_bn).map((food) => (
            <Text key={food} style={styles.riskFoodItem}>✓ {food}</Text>
          ))}
          {(language === "en" ? riskOverlay.avoid_en : riskOverlay.avoid_bn).length ? (
            <View style={styles.avoidBlock}>
              <Text style={styles.avoidTitle}>{language === "en" ? "Avoid:" : "এড়িয়ে চলুন:"}</Text>
              {(language === "en" ? riskOverlay.avoid_en : riskOverlay.avoid_bn).map((item) => (
                <Text key={item} style={styles.avoidItem}>× {item}</Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Recommended Food Grid */}
      {activeTab !== "medicine" && activeTab !== "rest" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.nutrition.recommended}</Text>
          <View style={styles.grid}>
            {visibleFoods.map((food) => (
              <NutritionCard
                key={food.id}
                imageSource={getFoodImage(food.name_bn, food.name_en) ?? undefined}
                onPress={() => showFoodInfo(food)}
                subtitle={language === "en" ? food.amount_en ?? food.amount_bn : food.amount_bn}
                tag={nutrientLabel(food.nutrient_focus[0], language)}
                title={language === "en" ? food.name_en : food.name_bn}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* Supplements Tab content */}
      {activeTab === "medicine" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{language === "en" ? "Supplements" : "সাপ্লিমেন্ট"}</Text>
          {SUPPLEMENT_GUIDANCE.map((supplement) => (
            <View key={supplement.id} style={styles.supplementCard}>
              <Text style={styles.suppName}>{language === "en" ? supplement.name_en ?? supplement.name_bn : supplement.name_bn}</Text>
              <Text style={styles.suppBody}>{language === "en" ? supplement.dose_en ?? supplement.dose_bn : supplement.dose_bn}</Text>
              <Text style={styles.suppTiming}>⏰ {language === "en" ? supplement.timing_en ?? supplement.timing_bn : supplement.timing_bn}</Text>
              {(language === "en" ? supplement.side_effects_en : supplement.side_effects_bn) ? (
                <Text style={styles.suppSideEffect}>⚠️ {language === "en" ? supplement.side_effects_en : supplement.side_effects_bn}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* Rest Tab content */}
      {activeTab === "rest" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{language === "en" ? "Rest advice" : "বিশ্রামের পরামর্শ"}</Text>
          {(language === "en"
            ? [
                "Sleep at least 8 hours a day.",
                "Sleeping on the left side can improve circulation.",
                "Avoid heavy work, especially in the last three months.",
                "Walk a little every 1-2 hours when possible.",
                "Talk with family to reduce stress."
              ]
            : [
                "দিনে কমপক্ষে ৮ ঘণ্টা ঘুমান।",
                "বাম পাশে শুয়ে ঘুমানো ভালো — এতে রক্তচলাচল ভালো হয়।",
                "ভারী কাজ এড়িয়ে চলুন, বিশেষ করে শেষ তিন মাসে।",
                "প্রতি ১-২ ঘণ্টা পর পর উঠে একটু হাঁটুন।",
                "মানসিক চাপ কমাতে পরিবারের সাথে কথা বলুন।"
              ]).map((tip) => (
            <View key={tip} style={styles.restTip}>
              <Text style={styles.restTipText}>✓ {tip}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Cautions section */}
      {plan?.cautions_bn?.length ? (
        <View style={styles.cautionSection}>
          <Text style={styles.cautionTitle}>⚠️ {language === "en" ? "Caution" : "সতর্কতা"}</Text>
          {(language === "en" ? plan.cautions_en ?? plan.cautions_bn : plan.cautions_bn).map((caution) => (
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
  },
  checklistCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F5ECE9",
    elevation: 2,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    gap: 10,
    marginTop: 10
  },
  checklistHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  checklistScoreBadge: {
    backgroundColor: "#FCEBE5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16
  },
  checklistScoreText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#E57A58"
  },
  checklistSubText: {
    fontSize: 13,
    color: "#70605A",
    lineHeight: 20
  },
  checklistCompletedText: {
    fontSize: 13,
    color: "#4A6047",
    fontWeight: "bold",
    lineHeight: 20
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#FFF2EF",
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
    marginVertical: 4
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#E57A58",
    borderRadius: 4
  },
  checklistItemsList: {
    gap: 8,
    marginTop: 6
  },
  checkItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF9F6",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFF2EF"
  },
  checkBoxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#70605A",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  checkBoxCircleFilled: {
    backgroundColor: "#E57A58",
    borderColor: "#E57A58"
  },
  checkItemLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#70605A"
  },
  checkItemLabelChecked: {
    color: "#A08E88",
    textDecorationLine: "line-through"
  },
  checkItemNote: {
    fontSize: 10,
    color: "#E57A58",
    fontWeight: "500",
    marginTop: 2
  }
});
