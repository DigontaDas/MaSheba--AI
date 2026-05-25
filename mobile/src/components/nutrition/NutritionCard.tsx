import type { ImageSourcePropType } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { radius, spacing, typography } from "@/theme";

export function NutritionCard({
  title,
  subtitle,
  tag,
  imageSource,
  onPress
}: {
  title: string;
  subtitle: string;
  tag: string;
  imageSource?: ImageSourcePropType;
  onPress?: () => void;
}) {
  // Resolve nutrient badge colors matching the design specs
  const getBadgeStyles = (nutrient: string) => {
    const text = nutrient.toLowerCase();
    if (text.includes("ক্যালসিয়াম") || text.includes("calcium")) {
      return { backgroundColor: "#386652" }; // Teal/Green
    }
    if (text.includes("প্রোটিন") || text.includes("protein")) {
      return { backgroundColor: "#84533C" }; // Golden/Brown
    }
    return { backgroundColor: "#8E3E26" }; // Coral/Red for Iron / others
  };

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        
        {/* Overlay Nutrient Badge */}
        <View style={[styles.badge, getBadgeStyles(tag)]}>
          <Text style={styles.badgeText}>{tag}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF0ED", // Warm peach-pink tint matching mockup
    borderRadius: 16,
    padding: 10,
    width: "47.5%", // Dynamic 2-column width with perfect spacing
    shadowColor: "#96482e",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 1.1,
    borderRadius: 12,
    overflow: "hidden"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fee2e1"
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: typography.label.fontFamily
  },
  body: {
    paddingTop: 8,
    paddingHorizontal: 4,
    gap: 2
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#271818",
    fontFamily: typography.h2.fontFamily
  },
  subtitle: {
    fontSize: 13,
    color: "#54433d",
    fontFamily: typography.caption.fontFamily
  }
});
