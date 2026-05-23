import { Tabs } from "expo-router";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { copy } from "@/data/stitchCopy.bn";
import { colors } from "@/theme";

export default function MotherTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNavigation {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="home" options={{ title: copy.common.home }} />
      <Tabs.Screen name="progress" options={{ title: "প্রগতি" }} />
      <Tabs.Screen name="nutrition" options={{ title: copy.common.nutrition }} />
      <Tabs.Screen name="chat" options={{ title: copy.common.chat }} />
      <Tabs.Screen name="profile" options={{ title: copy.common.profile }} />
    </Tabs>
  );
}
