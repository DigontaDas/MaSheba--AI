import { Tabs } from "expo-router";
import { ChwBottomNavigation } from "@/components/navigation/ChwBottomNavigation";
import { copy } from "@/data/stitchCopy.bn";
import { colors } from "@/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <ChwBottomNavigation {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="home" options={{ title: copy.common.home }} />
      <Tabs.Screen name="chat" options={{ title: copy.common.chat }} />
      <Tabs.Screen name="patients" options={{ title: copy.common.patients }} />
      <Tabs.Screen name="medicine" options={{ title: "ওষুধ" }} />
      <Tabs.Screen name="profile" options={{ title: copy.common.profile }} />
      <Tabs.Screen name="sync" options={{ href: null, title: copy.common.sync }} />
      <Tabs.Screen name="qa" options={{ href: null, title: copy.common.chat }} />
    </Tabs>
  );
}
