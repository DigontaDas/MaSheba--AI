import { NativeModules, LogBox } from "react-native";

// Ignore developer bridge and duplicate autolinking logs
LogBox.ignoreAllLogs(true);
LogBox.ignoreLogs([
  "Tried to insert a NativeModule into the bridge's",
  "Open debugger to view warnings."
]);



import "@/sync/backgroundSync";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { LanguageProvider } from "@/context/LanguageContext";
import { ensureLocalDbReady } from "@/db/localDbAccess";
import { setupNotifications } from "@/notifications/notificationSetup";
import { registerOutboxSyncTask } from "@/sync/registerSyncTask";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "HindSiliguri-Regular": require("../assets/Hind_Siliguri/HindSiliguri-Regular.ttf"),
    "HindSiliguri-Medium": require("../assets/Hind_Siliguri/HindSiliguri-Medium.ttf"),
    "HindSiliguri-SemiBold": require("../assets/Hind_Siliguri/HindSiliguri-SemiBold.ttf"),
    "HindSiliguri-Bold": require("../assets/Hind_Siliguri/HindSiliguri-Bold.ttf")
  });

  useEffect(() => {
    ensureLocalDbReady()
      .then(registerOutboxSyncTask)
      .catch((error) => { /* console.warn("Startup initialization failed", error) */ void error; });
    setupNotifications().catch((error) => { /* console.warn("Notification setup failed", error) */ void error; });
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(mother-tabs)" />
        <Stack.Screen name="assessment/[patientId]" />
        <Stack.Screen name="admin-dashboard" />
      </Stack>
      <StatusBar style="dark" />
    </LanguageProvider>
  );
}
