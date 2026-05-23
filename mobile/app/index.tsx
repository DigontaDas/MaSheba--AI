import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { resolveStoredRole } from "@/auth/roleSession";
import { colors } from "@/theme";

export default function IndexRoute() {
  useEffect(() => {
    resolveStoredRole()
      .then((role) => {
        if (role === "CHW") {
          router.replace("/(tabs)/patients");
          return;
        }
        if (role === "MOTHER") {
          router.replace("/(mother-tabs)/home");
          return;
        }
        router.replace("/(auth)/login");
      })
      .catch(() => router.replace("/(auth)/login"));
  }, []);

  return (
    <View style={styles.screen}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center"
  }
});
