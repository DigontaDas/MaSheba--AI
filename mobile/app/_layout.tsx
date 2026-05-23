import "@/sync/backgroundSync";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { initDB } from "@/db/database";
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
    initDB()
      .then(registerOutboxSyncTask)
      .catch((error) => console.warn("Startup initialization failed", error));
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
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(mother-tabs)" />
        <Stack.Screen name="assessment/[patientId]" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
