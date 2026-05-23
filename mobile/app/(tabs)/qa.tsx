import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmergencyQaBanner } from "@/components/EmergencyQaBanner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { getOfflineQaByTopic, getOfflineQaCategories } from "@/db/offlineQa";
import type { OfflineQa, OfflineQaTrimester } from "@/types/schema";

const TRIMESTERS: Array<{ label: string; value: OfflineQaTrimester }> = [
  { label: "১ম", value: "T1" },
  { label: "২য়", value: "T2" },
  { label: "৩য়", value: "T3" },
  { label: "প্রসবের পর", value: "POSTPARTUM" }
];

export default function OfflineQaScreen() {
  const categories = getOfflineQaCategories();
  const [trimester, setTrimester] = useState<OfflineQaTrimester>("T3");
  const [topic, setTopic] = useState(categories[0]);
  const [items, setItems] = useState<OfflineQa[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await getOfflineQaByTopic({ topic, trimester });
    setItems(rows);
    setActiveId((current) => (rows.some((item) => item.id === current) ? current : null));
  }, [topic, trimester]);

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [load]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <OfflineBanner />
      <Text style={styles.title}>মা ও শিশুর প্রশ্ন</Text>

      <View style={styles.segment}>
        {TRIMESTERS.map((item) => (
          <Pressable
            key={item.value}
            style={[styles.segmentButton, trimester === item.value && styles.segmentButtonActive]}
            onPress={() => setTrimester(item.value)}
          >
            <Text style={trimester === item.value ? styles.segmentTextActive : styles.segmentText}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.categories}>
        {categories.map((category) => (
          <Pressable
            key={category}
            style={[styles.category, topic === category && styles.categoryActive]}
            onPress={() => setTopic(category)}
          >
            <Text style={topic === category ? styles.categoryTextActive : styles.categoryText}>
              {category}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.questions}>
        {items.length === 0 ? (
          <Text style={styles.empty}>এই বিষয়ে এখনো প্রশ্ন যোগ করা হয়নি।</Text>
        ) : null}
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <Pressable
              key={item.id}
              style={[styles.question, item.emergency && styles.questionEmergency]}
              onPress={() => setActiveId(active ? null : item.id)}
            >
              <EmergencyQaBanner item={item} />
              <Text style={styles.questionText}>{item.question_bn}</Text>
              {active ? (
                <View style={styles.answer}>
                  <Text style={styles.week}>{item.week_range}</Text>
                  <Text style={styles.answerText}>{item.answer_bn}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1
  },
  content: {
    gap: 14,
    padding: 16
  },
  title: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800"
  },
  segment: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  segmentButton: {
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  segmentButtonActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#047857"
  },
  segmentText: {
    color: "#334155",
    fontWeight: "700"
  },
  segmentTextActive: {
    color: "#047857",
    fontWeight: "800"
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  category: {
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  categoryActive: {
    backgroundColor: "#e0f2fe",
    borderColor: "#0284c7"
  },
  categoryText: {
    color: "#334155",
    fontWeight: "700"
  },
  categoryTextActive: {
    color: "#0369a1",
    fontWeight: "800"
  },
  questions: {
    gap: 10
  },
  question: {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderRadius: 6,
    borderWidth: 1,
    gap: 8,
    padding: 12
  },
  questionEmergency: {
    borderColor: "#fda4af"
  },
  questionText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 24
  },
  answer: {
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    gap: 6,
    paddingTop: 10
  },
  week: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700"
  },
  answerText: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 23
  },
  empty: {
    color: "#64748b",
    padding: 16,
    textAlign: "center"
  }
});
