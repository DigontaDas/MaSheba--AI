import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export function SecondaryButton({
  label,
  onPress,
  disabled = false
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing.base
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    backgroundColor: colors.surfaceContainerLow
  },
  text: {
    ...typography.body,
    color: colors.primary,
    fontFamily: typography.h2.fontFamily
  }
});
