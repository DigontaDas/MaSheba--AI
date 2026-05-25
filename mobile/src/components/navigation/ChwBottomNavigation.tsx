import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors, radius, spacing, typography } from "@/theme";

const iconByRoute: Record<string, IconName> = {
  home: "home",
  chat: "chat-bubble",
  patients: "groups",
  profile: "person"
};

const visibleRouteNames = new Set(["home", "chat", "patients", "profile"]);

export function ChwBottomNavigation({ state, descriptors, navigation }: BottomTabBarProps) {
  const visibleRoutes = state.routes.filter((route) => visibleRouteNames.has(route.name));

  return (
    <View style={styles.wrap}>
      {visibleRoutes.map((route) => {
        const descriptor = descriptors[route.key];
        const options = descriptor.options;
        const focused = state.routes[state.index]?.key === route.key;
        const label =
          typeof options.title === "string"
            ? options.title
            : typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true
          });

          if (!focused && !event.defaultPrevented) {
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
            <Icon
              name={iconByRoute[route.name] ?? "circle"}
              color={focused ? colors.onPrimaryContainer : colors.onSurfaceVariant}
              size={22}
            />
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
    backgroundColor: colors.surfaceContainer,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 80,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8
  },
  item: {
    alignItems: "center",
    borderRadius: radius.full,
    flex: 1,
    gap: 2,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  itemActive: {
    backgroundColor: colors.primaryContainer
  },
  label: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  labelActive: {
    color: colors.onPrimaryContainer,
    fontFamily: typography.label.fontFamily
  }
});
