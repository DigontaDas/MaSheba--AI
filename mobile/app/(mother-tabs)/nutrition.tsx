import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { NutritionCard } from "@/components/nutrition/NutritionCard";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { Icon } from "@/components/ui/Icon";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { clearRoleSession } from "@/auth/roleSession";
import { clearSession } from "@/auth/secureSession";
import { supabase } from "@/auth/supabaseAuth";
import { copy } from "@/data/stitchCopy.bn";
import { colors, radius, spacing, typography } from "@/theme";

const filters = [copy.nutrition.all, copy.nutrition.food, copy.nutrition.drinks, copy.nutrition.medicine, copy.nutrition.rest];
const nutritionItems = [
  {
    title: copy.nutrition.spinach,
    subtitle: copy.nutrition.spinachAmount,
    tag: copy.nutrition.iron,
    category: copy.nutrition.food,
    imageSource: require("../../assets/illustrations/image.png_1.png")
  },
  {
    title: copy.nutrition.lentil,
    subtitle: copy.nutrition.lentilAmount,
    tag: copy.nutrition.protein,
    category: copy.nutrition.food,
    imageSource: require("../../assets/illustrations/image.png_2.png")
  },
  {
    title: copy.nutrition.milk,
    subtitle: copy.nutrition.milkAmount,
    tag: copy.nutrition.calcium,
    category: copy.nutrition.drinks,
    imageSource: require("../../assets/illustrations/image.png_3.png")
  },
  {
    title: copy.nutrition.pomegranate,
    subtitle: copy.nutrition.pomegranateAmount,
    tag: copy.nutrition.growth,
    category: copy.nutrition.food,
    imageSource: require("../../assets/illustrations/image.png_4.png")
  }
];

export default function NutritionScreen() {
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const visibleItems = useMemo(
    () => nutritionItems.filter((item) => activeFilter === copy.nutrition.all || item.category === activeFilter),
    [activeFilter]
  );

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
    Alert.alert(item.title, `${item.subtitle}\n${item.tag}`, [{ text: "ঠিক আছে" }]);
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
      <Text style={styles.title}>{copy.nutrition.title}</Text>
      <View style={styles.filters}>
        {filters.map((filter) => (
          <Pressable
            accessibilityLabel={filter}
            accessibilityRole="button"
            accessibilityState={{ selected: activeFilter === filter }}
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[styles.filter, activeFilter === filter && styles.filterActive]}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.waterCard}>
        <View style={styles.waterHeader}>
          <View style={styles.waterIcon}>
            <Icon name="water-drop" color={colors.tertiary} />
          </View>
          <View style={styles.waterText}>
            <Text style={styles.cardTitle}>{copy.nutrition.water}</Text>
            <Text style={styles.meta}>{copy.nutrition.waterDescription}</Text>
          </View>
          <Text style={styles.waterProgress}>{copy.nutrition.waterProgress}</Text>
        </View>
        <ProgressBar value={3} max={8} />
      </View>

      <Text style={styles.sectionTitle}>{copy.nutrition.recommended}</Text>
      <View style={styles.grid}>
        {visibleItems.map((item) => (
          <NutritionCard key={item.title} {...item} onPress={() => showNutritionInfo(item)} />
        ))}
      </View>
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
  title: {
    ...typography.h1,
    color: colors.onSurface
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  filter: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm
  },
  filterActive: {
    backgroundColor: colors.primaryFixed
  },
  filterText: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  filterTextActive: {
    color: colors.primary
  },
  waterCard: {
    backgroundColor: colors.tertiaryFixed,
    borderRadius: radius.card,
    gap: spacing.base,
    padding: spacing.cardPadding
  },
  waterHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  waterIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  waterText: {
    flex: 1
  },
  cardTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontFamily: typography.h2.fontFamily
  },
  meta: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  waterProgress: {
    ...typography.h2,
    color: colors.tertiary
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
