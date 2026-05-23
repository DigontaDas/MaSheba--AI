import { Tabs } from "expo-router";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { copy } from "@/data/stitchCopy.bn";
import { colors } from "@/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNavigation {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="patients" options={{ title: copy.common.home }} />
      <Tabs.Screen name="sync" options={{ title: "সিঙ্ক" }} />
      <Tabs.Screen name="qa" options={{ title: copy.common.chat }} />
    </Tabs>
  );
}
