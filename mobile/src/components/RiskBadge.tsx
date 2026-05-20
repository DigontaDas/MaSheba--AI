import { StyleSheet, Text, View } from "react-native";
import type { RiskLevel } from "@/types/schema";

const tone = {
  LOW: { backgroundColor: "#dcfce7", color: "#166534" },
  MODERATE: { backgroundColor: "#fef3c7", color: "#92400e" },
  HIGH: { backgroundColor: "#ffe4e6", color: "#be123c" }
} satisfies Record<RiskLevel, { backgroundColor: string; color: string }>;

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <View style={[styles.badge, { backgroundColor: tone[level].backgroundColor }]}>
      <Text style={[styles.text, { color: tone[level].color }]}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  text: {
    fontSize: 12,
    fontWeight: "700"
  }
});
