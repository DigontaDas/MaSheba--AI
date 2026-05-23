import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { colors, radius, spacing, typography } from "@/theme";

export function EmergencyBanner({
  title,
  message,
  actionLabel,
  onAction
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.banner}>
      <View style={styles.header}>
        <Icon name="warning" color={colors.error} size={20} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.button}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.errorContainer,
    borderColor: colors.error,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.base
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  title: {
    ...typography.body,
    color: colors.onErrorContainer,
    flex: 1,
    fontFamily: typography.h2.fontFamily
  },
  message: {
    ...typography.label,
    color: colors.onErrorContainer
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: colors.error,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm
  },
  buttonText: {
    ...typography.label,
    color: colors.onError
  }
});
