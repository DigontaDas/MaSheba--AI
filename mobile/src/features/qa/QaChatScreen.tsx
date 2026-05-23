import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { EmergencyBanner } from "@/components/emergency/EmergencyBanner";
import { Icon } from "@/components/ui/Icon";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { copy } from "@/data/stitchCopy.bn";
import { getEmergencyOfflineQa, getOfflineQaByTopic, getOfflineQaCategories } from "@/db/offlineQa";
import { colors, radius, spacing, typography } from "@/theme";
import type { OfflineQa, OfflineQaTrimester } from "@/types/schema";

type Message = {
  id: string;
  role: "ai" | "user";
  text: string;
  item?: OfflineQa;
};

const trim: OfflineQaTrimester = "T3";

export function QaChatScreen() {
  const categories = useMemo(() => getOfflineQaCategories().slice(0, 8), []);
  const [topic, setTopic] = useState(categories[0] ?? "");
  const [items, setItems] = useState<OfflineQa[]>([]);
  const [input, setInput] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: "hello", role: "ai", text: copy.qa.greeting },
    { id: "sample-user", role: "user", text: copy.qa.sampleQuestion },
    {
      id: "sample-ai",
      role: "ai",
      text: copy.qa.sampleAnswer,
      item: {
        id: "sample-warning",
        trimester: "ALL",
        week_range: "",
        topic: "",
        question_bn: copy.qa.sampleQuestion,
        answer_bn: copy.qa.highRiskBody,
        severity: "HIGH",
        see_doctor: true,
        emergency: false
      }
    }
  ]);

  const load = useCallback(async () => {
    if (!topic) {
      setItems([]);
      return;
    }
    try {
      setLoadError(null);
      const nextItems = await getOfflineQaByTopic({ topic, trimester: trim });
      setItems(nextItems);
    } catch (loadError) {
      setItems([]);
      setLoadError(loadError instanceof Error ? loadError.message : copy.common.loadFailed);
    }
  }, [topic]);

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [load]);

  const askItem = (item: OfflineQa) => {
    setMessages((current) => [
      ...current,
      { id: `${item.id}-q-${current.length}`, role: "user", text: item.question_bn },
      { id: `${item.id}-a-${current.length}`, role: "ai", text: item.answer_bn, item }
    ]);
  };

  const submitInput = async () => {
    const question = input.trim();
    if (!question) {
      return;
    }
    setInput("");
    const emergency = await getEmergencyOfflineQa();
    const answer = items[0] ?? emergency[0];
    setMessages((current) => [
      ...current,
      { id: `custom-q-${Date.now()}`, role: "user", text: question },
      {
        id: `custom-a-${Date.now()}`,
        role: "ai",
        text: answer?.answer_bn ?? copy.qa.sampleAnswer,
        item: answer
      }
    ]);
  };

  return (
    <ScreenShell padded={false}>
      <View style={styles.top}>
        <Icon name="arrow-back" color={colors.onSurface} />
        <View style={styles.topTitle}>
          <Text style={styles.title}>{copy.common.appName}</Text>
          <Text style={styles.online}>{copy.common.offlineNotice}</Text>
        </View>
        <View style={styles.urgent}>
          <Icon name="warning" color={colors.error} size={16} />
          <Text style={styles.urgentText}>{copy.common.emergency}</Text>
        </View>
      </View>

      {loadError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {categories.length ? (
          categories.map((category) => (
            <Pressable
              key={category}
              accessibilityLabel={category}
              accessibilityRole="button"
              accessibilityState={topic === category ? { selected: true } : {}}
              onPress={() => setTopic(category)}
              style={[styles.category, topic === category && styles.categoryActive]}
            >
              <Text style={[styles.categoryText, topic === category && styles.categoryTextActive]} numberOfLines={1}>
                {category}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.empty}>{copy.qa.noCategories}</Text>
        )}
      </ScrollView>

      <View style={styles.messages}>
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            role={message.role}
            text={message.text}
            timestamp={message.role === "ai" ? "১০:৩০ এএম" : "১০:৩২ এএম"}
            warningCard={
              message.item?.severity === "HIGH"
                ? { title: copy.qa.highRiskTitle, description: message.item.answer_bn }
                : undefined
            }
          />
        ))}
      </View>

      <View style={styles.questionList}>
        {items.length ? (
          items.slice(0, 5).map((item) => (
            <Pressable key={item.id} accessibilityLabel={item.question_bn} accessibilityRole="button" onPress={() => askItem(item)} style={styles.question}>
              <Text style={styles.questionText}>{item.question_bn}</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.empty}>{copy.qa.noQuestions}</Text>
        )}
      </View>

      <EmergencyBanner title={copy.qa.highRiskTitle} message={copy.qa.highRiskBody} />

      <View style={styles.smsRow}>
        <Text style={styles.sms}>{copy.qa.sms}</Text>
        <Text style={styles.smsNumber}>16789</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel={copy.qa.askPlaceholder}
          onChangeText={setInput}
          onSubmitEditing={submitInput}
          placeholder={copy.qa.askPlaceholder}
          placeholderTextColor={colors.outline}
          style={styles.input}
          value={input}
        />
        <Pressable accessibilityLabel="প্রশ্ন পাঠান" accessibilityRole="button" onPress={submitInput} style={styles.send}>
          <Icon name="mic" color={colors.onPrimary} />
        </Pressable>
      </View>
      <View style={styles.secure}>
        <Icon name="lock" color={colors.secondary} size={16} />
        <Text style={styles.secureText}>{copy.common.secured}</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  top: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.base
  },
  topTitle: {
    flex: 1
  },
  title: {
    ...typography.h2,
    color: colors.onSurface
  },
  online: {
    ...typography.caption,
    color: colors.secondary
  },
  urgent: {
    alignItems: "center",
    backgroundColor: colors.errorContainer,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  urgentText: {
    ...typography.caption,
    color: colors.onErrorContainer
  },
  errorCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.marginMobile,
    padding: spacing.base
  },
  errorText: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  categories: {
    gap: spacing.sm,
    paddingHorizontal: spacing.marginMobile
  },
  category: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm
  },
  categoryActive: {
    backgroundColor: colors.primaryFixed
  },
  categoryText: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  categoryTextActive: {
    color: colors.primary
  },
  messages: {
    gap: spacing.base,
    paddingHorizontal: spacing.marginMobile
  },
  questionList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.marginMobile
  },
  question: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 44,
    padding: spacing.base
  },
  questionText: {
    ...typography.label,
    color: colors.onSurface
  },
  smsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center"
  },
  sms: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  smsNumber: {
    ...typography.label,
    color: colors.primary
  },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.marginMobile
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.full,
    borderWidth: 1,
    color: colors.onSurface,
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.base
  },
  send: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  secure: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center"
  },
  secureText: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  empty: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm
  }
});
