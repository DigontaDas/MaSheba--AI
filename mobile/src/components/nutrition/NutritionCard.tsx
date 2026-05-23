import type { ImageSourcePropType } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { colors, radius, spacing, typography } from "@/theme";

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
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {imageSource ? <Image source={imageSource} style={styles.image} contentFit="cover" /> : <View style={styles.imagePlaceholder} />}
      <View style={styles.body}>
        <Text style={styles.tag}>{tag}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    flex: 1,
    minWidth: 150,
    overflow: "hidden"
  },
  pressed: {
    opacity: 0.9
  },
  image: {
    aspectRatio: 1.35,
    width: "100%"
  },
  imagePlaceholder: {
    aspectRatio: 1.35,
    backgroundColor: colors.surfaceContainerHigh,
    width: "100%"
  },
  body: {
    gap: spacing.xs,
    padding: spacing.base
  },
  tag: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: typography.label.fontFamily
  },
  title: {
    ...typography.body,
    color: colors.onSurface,
    fontFamily: typography.h2.fontFamily
  },
  subtitle: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  }
});
