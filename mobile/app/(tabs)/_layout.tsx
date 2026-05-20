import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true, tabBarActiveTintColor: "#047857" }}>
      <Tabs.Screen name="patients" options={{ title: "Patients" }} />
      <Tabs.Screen name="sync" options={{ title: "Sync" }} />
    </Tabs>
  );
}
