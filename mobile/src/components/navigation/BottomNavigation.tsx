import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Icon, type IconName } from "@/components/ui/Icon";
import { colors, radius, spacing, typography } from "@/theme";

const iconByRoute: Record<string, IconName> = {
  patients: "home",
  sync: "sync",
  qa: "chat-bubble",
  home: "home",
  alerts: "warning",
  shotorkota: "warning",
  nutrition: "restaurant-menu",
  chat: "chat-bubble",
  profile: "person"
};

export function BottomNavigation({ state, descriptors, navigation }: BottomTabBarProps) {
  const visibleRoutes = state.routes.filter((route) => {
    const options = descriptors[route.key]?.options as { href?: string | null } | undefined;
    return route.name !== "progress" && route.name !== "alerts" && options?.href !== null;
  });

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
            style={styles.item}
          >
            <Icon
              name={iconByRoute[route.name] ?? "circle"}
              color={focused ? colors.primary : colors.onSurfaceVariant}
              size={22}
            />
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
            <View style={[styles.dot, focused && styles.dotActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 76,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm
  },
  item: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    gap: 2,
    minHeight: 44,
    justifyContent: "center",
    minWidth: 0
  },
  label: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  labelActive: {
    color: colors.primary,
    fontFamily: typography.label.fontFamily
  },
  dot: {
    backgroundColor: "transparent",
    borderRadius: radius.full,
    height: 4,
    width: 16
  },
  dotActive: {
    backgroundColor: colors.primaryContainer
  }
});
