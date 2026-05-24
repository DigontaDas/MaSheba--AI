import { useMemo, useState, useEffect } from "react";
import { Alert, Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { NutritionCard } from "@/components/nutrition/NutritionCard";
import { Icon } from "@/components/ui/Icon";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { clearRoleSession } from "@/auth/roleSession";
import { clearSession } from "@/auth/secureSession";
import { supabase } from "@/auth/supabaseAuth";
import { copy } from "@/data/stitchCopy.bn";
import { colors, radius, spacing, typography } from "@/theme";

// Helper function to convert numbers to beautiful Bengali digits dynamically
const toBanglaDigits = (num: number): string => {
  const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num)
    .split("")
    .map((char) => digits[parseInt(char)] || char)
    .join("");
};

const filters = [
  copy.nutrition.all,      // সব
  copy.nutrition.food,     // খাবার
  copy.nutrition.drinks,   // পানীয়
  copy.nutrition.medicine, // ওষুধ
  copy.nutrition.rest,     // বিশ্রাম
  "শিশু"                   // শিশু (Matching mockup horizontal tabs)
];

const nutritionItems = [
  {
    title: copy.nutrition.spinach,
    subtitle: copy.nutrition.spinachAmount,
    tag: copy.nutrition.iron, // আয়রন
    category: copy.nutrition.food,
    imageSource: require("../../assets/images/palong.jpg")
  },
  {
    title: copy.nutrition.lentil,
    subtitle: copy.nutrition.lentilAmount,
    tag: copy.nutrition.protein, // প্রোটিন
    category: copy.nutrition.food,
    imageSource: require("../../assets/images/moshur.jpg")
  },
  {
    title: copy.nutrition.milk,
    subtitle: copy.nutrition.milkAmount,
    tag: copy.nutrition.calcium, // ক্যালসিয়াম
    category: copy.nutrition.drinks,
    imageSource: require("../../assets/images/milk.jpg")
  },
  {
    title: copy.nutrition.pomegranate,
    subtitle: copy.nutrition.pomegranateAmount,
    tag: copy.nutrition.iron, // "আয়রন" tag matching mockup exactly!
    category: copy.nutrition.food,
    imageSource: require("../../assets/images/dalim.jpg")
  }
];

export default function NutritionScreen() {
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [waterCount, setWaterCount] = useState(3); // Default demo value

  // Load the daily tracked water count from SecureStore on mount
  useEffect(() => {
    const loadWaterTracker = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const savedDate = await SecureStore.getItemAsync("maasheba.water_date");
        const savedCount = await SecureStore.getItemAsync("maasheba.water_count");
        
        if (savedDate === today && savedCount !== null) {
          setWaterCount(parseInt(savedCount, 10));
        } else {
          // If a new day has started (or first load), initialize at 3 for demo,
          // then save for today.
          setWaterCount(3);
          await SecureStore.setItemAsync("maasheba.water_date", today);
          await SecureStore.setItemAsync("maasheba.water_count", "3");
        }
      } catch (e) {
        console.warn("Failed to load water tracker:", e);
      }
    };
    loadWaterTracker();
  }, []);

  const visibleItems = useMemo(() => {
    if (activeFilter === copy.nutrition.all) {
      return nutritionItems;
    }
    // "শিশু" category filter fallback
    if (activeFilter === "শিশু") {
      return [];
    }
    return nutritionItems.filter((item) => item.category === activeFilter);
  }, [activeFilter]);

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

  const showNutritionInfo = (item: (typeof nutritionItems)[number]) => {
    Alert.alert(item.title, `${item.subtitle}\nউৎস: ${item.tag}`, [{ text: "ঠিক আছে" }]);
  };

  // Fun interactive water incrementer with lock-at-completion & secure persistence
  const handleWaterTap = async () => {
    if (waterCount >= 8) {
      // Completed! Keep it locked at 8 and do not reset.
      return;
    }
    
    const nextCount = waterCount + 1;
    setWaterCount(nextCount);
    
    try {
      const today = new Date().toISOString().split("T")[0];
      await SecureStore.setItemAsync("maasheba.water_date", today);
      await SecureStore.setItemAsync("maasheba.water_count", String(nextCount));
    } catch (e) {
      console.warn("Failed to save water count:", e);
    }
  };

  // Resolve dynamic titles & celebratory messaging on completion
  const isCompleted = waterCount >= 8;
  const waterTitle = isCompleted ? "পানি পানের লক্ষ্য সম্পন্ন! ✅" : copy.nutrition.water;
  const waterSubtitle = isCompleted 
    ? "অভিনন্দন! আপনি আজকের পানির লক্ষ্য সফলভাবে অর্জন করেছেন 🎉" 
    : copy.nutrition.waterDescription;

  return (
    <ScreenShell scrollable={true} padded={true}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="মেনু" accessibilityRole="button" onPress={showMenu} style={styles.iconButton}>
          <Icon name="menu" size={24} color="#8E3E26" />
        </Pressable>
        <Text style={styles.appName}>মাশেবা AI</Text>
        <Pressable accessibilityLabel="নোটিফিকেশন" accessibilityRole="button" onPress={showNotifications} style={styles.iconButton}>
          <Icon name="notifications" size={24} color="#8E3E26" />
        </Pressable>
      </View>

      {/* Main Screen Title */}
      <Text style={styles.title}>{copy.nutrition.title}</Text>

      {/* Horizontally-Scrollable Pill Tab Bar Filters */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <Pressable
                accessibilityLabel={filter}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={({ pressed }) => [
                  styles.filter,
                  active && styles.filterActive,
                  pressed && styles.pressedFilter
                ]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Interactive Water Tracker Card */}
      <Pressable onPress={handleWaterTap} style={({ pressed }) => [styles.waterCard, pressed && styles.pressedFilter]}>
        <View style={styles.waterHeader}>
          <Text style={styles.waterTitle}>{waterTitle}</Text>
          <View style={styles.waterBadge}>
            <Text style={styles.waterBadgeText}>{toBanglaDigits(waterCount)}/৮</Text>
          </View>
        </View>
        
        <Text style={styles.waterSubtitle}>{waterSubtitle}</Text>
        
        {/* Rounded Glass Blocks Grid */}
        <View style={styles.waterGrid}>
          {Array.from({ length: 8 }).map((_, index) => {
            const filled = index < waterCount;
            return (
              <View
                key={index}
                style={[
                  styles.waterBar,
                  filled ? styles.waterBarActive : styles.waterBarInactive
                ]}
              />
            );
          })}
        </View>
      </Pressable>

      {/* Recommended Food Header */}
      <Text style={styles.sectionTitle}>{copy.nutrition.recommended}</Text>

      {/* 2x2 Grid Recommended Food Cards */}
      <View style={styles.grid}>
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <NutritionCard key={item.title} {...item} onPress={() => showNutritionInfo(item)} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>কোনো খাবার পাওয়া যায়নি।</Text>
          </View>
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4
  },
  appName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#e8896a",
    textAlign: "center",
    flex: 1,
    fontFamily: typography.h2.fontFamily,
    letterSpacing: 0.5
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8E3E26",
    fontFamily: typography.h1.fontFamily,
    marginTop: 12,
    marginBottom: 8
  },
  filtersWrapper: {
    marginHorizontal: -16, // Stretch categories out full bleed beyond page padding
    marginBottom: 16
  },
  filtersScroll: {
    paddingHorizontal: 16
  },
  filtersContent: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 32
  },
  filter: {
    backgroundColor: "#ffffff",
    borderColor: "#dac1ba",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 64
  },
  filterActive: {
    backgroundColor: "#e8896a",
    borderColor: "transparent"
  },
  filterText: {
    fontSize: 14,
    color: "#54433d",
    fontWeight: "600",
    fontFamily: typography.label.fontFamily
  },
  filterTextActive: {
    color: "#ffffff",
    fontWeight: "bold"
  },
  pressedFilter: {
    opacity: 0.92
  },
  /* Water Card styling matching mockup colors */
  waterCard: {
    backgroundColor: "#D2ECFC", // Soft blue background tint
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#2c4b58",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  waterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  waterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C333B",
    flex: 1,
    fontFamily: typography.h2.fontFamily
  },
  waterBadge: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  waterBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1C333B",
    fontFamily: typography.label.fontFamily
  },
  waterSubtitle: {
    fontSize: 14,
    color: "#3B5B66",
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: typography.body.fontFamily
  },
  waterGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%"
  },
  waterBar: {
    height: 48,
    width: "10.5%", // Fits 8 bars perfectly with safe standard spacing gaps
    borderRadius: 6
  },
  waterBarActive: {
    backgroundColor: "#3B5B66" // Dark slate-grey active glasses
  },
  waterBarInactive: {
    backgroundColor: "rgba(59, 91, 102, 0.18)" // Soft transparent-blue un-drank glasses
  },
  /* Recommended foods section styling */
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#271818",
    marginBottom: 16,
    fontFamily: typography.h2.fontFamily
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
    paddingBottom: 20
  },
  emptyContainer: {
    width: "100%",
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyText: {
    fontSize: 14,
    color: "#87726c",
    fontFamily: typography.body.fontFamily
  }
});
