import { useState, useEffect, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useNetworkState } from "expo-network";
import { useLanguage } from "@/context/LanguageContext";
import { Icon } from "./Icon";
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
  const { language } = useLanguage();
  const [role, setRole] = useState<string | null>(null);
  const network = typeof useNetworkState === "function" ? useNetworkState() : { isConnected: true, isInternetReachable: true };

  useEffect(() => {
    SecureStore.getItemAsync("maasheba.user_role")
      .then(setRole)
      .catch(() => null);
  }, []);

  const isOffline = role === "MOTHER" && (network.isConnected === false || network.isInternetReachable === false);

  const banner = isOffline ? (
    <View style={styles.offlineBanner}>
      <Icon name="wifi-off" color={colors.onSecondaryContainer} size={14} />
      <Text style={styles.offlineText}>
        {language === "bn" ? "অফলাইন মোড" : "Offline Mode"}
      </Text>
    </View>
  ) : null;

  if (!scrollable) {
    return (
      <SafeAreaView style={styles.safe}>
        {banner}
        <View style={[styles.content, padded ? styles.padded : null]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {banner}
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
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondaryContainer,
    paddingVertical: 6,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant
  },
  offlineText: {
    color: colors.onSecondaryContainer,
    fontSize: 12,
    fontWeight: "bold"
  }
});
