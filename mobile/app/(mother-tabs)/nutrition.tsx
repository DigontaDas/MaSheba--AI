import { Pressable, StyleSheet, Text, View } from "react-native";
import { NutritionCard } from "@/components/nutrition/NutritionCard";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { Icon } from "@/components/ui/Icon";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { copy } from "@/data/stitchCopy.bn";
import { colors, radius, spacing, typography } from "@/theme";

const filters = [copy.nutrition.all, copy.nutrition.food, copy.nutrition.drinks, copy.nutrition.medicine, copy.nutrition.rest];

export default function NutritionScreen() {
  return (
    <ScreenShell>
      <View style={styles.topBar}>
        <Icon name="menu" />
        <Text style={styles.appName}>{copy.common.appName}</Text>
        <Icon name="notifications" />
      </View>
      <Text style={styles.title}>{copy.nutrition.title}</Text>
      <View style={styles.filters}>
        {filters.map((filter, index) => (
          <Pressable key={filter} style={[styles.filter, index === 0 && styles.filterActive]}>
            <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{filter}</Text>
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
        <NutritionCard title={copy.nutrition.spinach} subtitle={copy.nutrition.spinachAmount} tag={copy.nutrition.iron} imageSource={require("../../assets/illustrations/image.png_1.png")} />
        <NutritionCard title={copy.nutrition.lentil} subtitle={copy.nutrition.lentilAmount} tag={copy.nutrition.protein} imageSource={require("../../assets/illustrations/image.png_2.png")} />
        <NutritionCard title={copy.nutrition.milk} subtitle={copy.nutrition.milkAmount} tag={copy.nutrition.calcium} imageSource={require("../../assets/illustrations/image.png_3.png")} />
        <NutritionCard title={copy.nutrition.pomegranate} subtitle={copy.nutrition.pomegranateAmount} tag={copy.nutrition.growth} imageSource={require("../../assets/illustrations/image.png_4.png")} />
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
