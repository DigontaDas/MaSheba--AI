import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { Icon, type IconName } from "./Icon";
import { colors, radius, spacing, typography } from "@/theme";

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  iconName
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  iconName?: IconName;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <>
          <Text style={styles.text}>{label}</Text>
          {iconName ? <Icon name={iconName} color={colors.onPrimary} size={20} /> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing.base
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    opacity: 0.86
  },
  text: {
    ...typography.body,
    color: colors.onPrimary,
    fontFamily: typography.h2.fontFamily
  }
});
