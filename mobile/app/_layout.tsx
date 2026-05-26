import { NativeModules, LogBox } from "react-native";

// Ignore developer bridge and duplicate autolinking logs
LogBox.ignoreAllLogs(true);
LogBox.ignoreLogs([
  "Tried to insert a NativeModule into the bridge's",
  "Open debugger to view warnings."
]);

if (!NativeModules.Onnxruntime) {
  NativeModules.Onnxruntime = {
    install: () => {
      console.warn("Onnxruntime native module stub installed at root layout.");
    },
    isStub: true
  } as any;
}

import "@/sync/backgroundSync";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { ensureLocalDbReady } from "@/db/localDbAccess";
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
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(mother-tabs)" />
        <Stack.Screen name="assessment/[patientId]" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
