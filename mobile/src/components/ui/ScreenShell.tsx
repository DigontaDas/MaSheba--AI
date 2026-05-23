import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

export function ScreenShell({
  children,
  scrollable = true,
  padded = true
}: {
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
}) {
  if (!scrollable) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.content, padded ? styles.padded : null]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={styles.safe}
        contentContainerStyle={[styles.content, padded ? styles.padded : null]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    gap: spacing.base,
    paddingBottom: spacing.xl
  },
  padded: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.base
  }
});
