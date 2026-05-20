import "@/sync/backgroundSync";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { initDB } from "@/db/database";
import { registerOutboxSyncTask } from "@/sync/registerSyncTask";

export default function RootLayout() {
  useEffect(() => {
    initDB()
      .then(registerOutboxSyncTask)
      .catch((error) => console.warn("Startup initialization failed", error));
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="assessment/[patientId]" options={{ headerShown: true, title: "Risk assessment" }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
