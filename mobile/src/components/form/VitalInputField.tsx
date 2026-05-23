import type { KeyboardTypeOptions } from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export function VitalInputField({
  label,
  value,
  unit,
  keyboardType = "numeric",
  onChangeText,
  error
}: {
  label: string;
  value: string;
  unit?: string;
  keyboardType?: KeyboardTypeOptions;
  onChangeText: (text: string) => void;
  error?: string;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputError]}>
        <TextInput
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholderTextColor={colors.outline}
          style={styles.input}
          value={value}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs
  },
  label: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: spacing.base
  },
  inputError: {
    borderColor: colors.error
  },
  input: {
    ...typography.body,
    color: colors.onSurface,
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm
  },
  unit: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  error: {
    ...typography.caption,
    color: colors.error
  }
});
