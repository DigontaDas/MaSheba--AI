import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { colors, radius, spacing, typography } from "@/theme";

const iconByRoute: Record<string, IconName> = {
  home: "home",
  chat: "chat-bubble",
  patients: "groups",
  medicine: "medication",
  profile: "person"
};

const routeLabels: Record<string, string> = {
  home: "হোম",
  chat: "চ্যাট",
  patients: "রোগী",
  medicine: "ওষুধ",
  profile: "প্রোফাইল"
};

export function ChwBottomNavigation({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useLanguage();
  // Extract visible routes and insert the custom "medicine" tab in the 4th slot
  const nativeRoutes = state.routes.filter((r) => ["home", "chat", "patients", "medicine", "profile"].includes(r.name));
  
  // Construct the 5 tabs in the exact order: Home, Chat, Patients, Medicine, Profile
  const items = [
    nativeRoutes.find((r) => r.name === "home"),
    nativeRoutes.find((r) => r.name === "chat"),
    nativeRoutes.find((r) => r.name === "patients"),
    nativeRoutes.find((r) => r.name === "medicine"),
    nativeRoutes.find((r) => r.name === "profile")
  ].filter(Boolean) as Array<{ name: string; key: string }>;

  return (
    <View style={styles.wrap}>
      {items.map((route) => {
        const focused = state.routes[state.index]?.key === route.key;
        
        const label = t(`nav.${route.name}`);

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true
          });

          if (!focused && !event?.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            key={route.key}
            onPress={onPress}
            style={[styles.item, focused && styles.itemActive]}
          >
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Icon
                name={iconByRoute[route.name] ?? "circle"}
                color={focused ? "#FFFFFF" : "#70605A"}
                size={22}
              />
            </View>
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    backgroundColor: "#FFF5F2", // Warm peach-pink background matching design perfectly
    borderTopWidth: 1,
    borderTopColor: "#F5ECE9",
    flexDirection: "row",
    gap: 4,
    minHeight: 74,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    elevation: 10,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16
  },
  item: {
    alignItems: "center",
    flex: 1,
    gap: 4,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 0
  },
  iconContainer: {
    width: 52,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  iconContainerActive: {
    backgroundColor: "#E57A58" // Solid brand terracotta pill background
  },
  itemActive: {
    // Left empty since active state uses the custom active pill styles
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#70605A",
    textAlign: "center"
  },
  labelActive: {
    color: "#E57A58", // Highlight active label in terracotta orange
    fontWeight: "bold"
  }
});
