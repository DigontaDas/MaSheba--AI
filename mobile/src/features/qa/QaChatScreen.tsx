import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { EmergencyBanner } from "@/components/emergency/EmergencyBanner";
import { Icon } from "@/components/ui/Icon";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { copy } from "@/data/stitchCopy.bn";
import { getQaByTopic, getQaCategories, type QaCategory } from "@/features/qa/offlineQaStore";
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
  const categories = useMemo(() => getQaCategories(), []);
  const [category, setCategory] = useState<QaCategory | null>(null);
  const [items, setItems] = useState<OfflineQa[]>([]);
  const [input, setInput] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "hello", role: "ai", text: copy.qa.greeting }
  ]);

  const selectCategory = useCallback(async (nextCategory: QaCategory) => {
    setCategory(nextCategory);
    setLoadingQuestions(true);
    try {
      setLoadError(null);
      const nextItems = await getQaByTopic({ topic: nextCategory.topic, trimester: trim });
      setItems(nextItems);
    } catch (loadError) {
      setItems([]);
      setLoadError(loadError instanceof Error ? loadError.message : copy.common.loadFailed);
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  const askItem = (item: OfflineQa) => {
    setMessages((current) => [
      ...current,
      { id: `${item.id}-q-${current.length}`, role: "user", text: item.question_bn },
      { id: `${item.id}-a-${current.length}`, role: "ai", text: item.answer_bn, item }
    ]);
  };

  const submitInput = () => {
    const question = input.trim();
    if (!question) {
      return;
    }
    setInput("");
    setMessages((current) => [
      ...current,
      { id: `custom-q-${Date.now()}`, role: "user", text: question },
      { id: `custom-a-${Date.now()}`, role: "ai", text: copy.qa.freeTextUnsupported }
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
          categories.map((nextCategory) => (
            <Pressable
              key={nextCategory.topic}
              accessibilityLabel={nextCategory.label}
              accessibilityRole="button"
              accessibilityState={category?.topic === nextCategory.topic ? { selected: true } : {}}
              onPress={() => selectCategory(nextCategory)}
              style={[styles.category, category?.topic === nextCategory.topic && styles.categoryActive]}
            >
              <Text style={[styles.categoryText, category?.topic === nextCategory.topic && styles.categoryTextActive]} numberOfLines={1}>
                {nextCategory.label}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.empty}>{copy.qa.noCategories}</Text>
        )}
      </ScrollView>

      <View style={styles.messages}>
        {messages.map((message) => (
          <View key={message.id} style={styles.messageWrap}>
            {message.item?.emergency ? (
              <EmergencyBanner title={copy.qa.highRiskTitle} message={message.item.answer_bn} />
            ) : (
              <ChatBubble role={message.role} text={message.text} />
            )}
          </View>
        ))}
      </View>

      <View style={styles.questionList}>
        {!category ? (
          <Text style={styles.empty}>{copy.qa.chooseCategory}</Text>
        ) : loadingQuestions ? (
          <Text style={styles.empty}>{copy.qa.loadingQuestions}</Text>
        ) : items.length ? (
          items.slice(0, 5).map((item) => (
            <Pressable key={item.id} accessibilityLabel={item.question_bn} accessibilityRole="button" onPress={() => askItem(item)} style={styles.question}>
              <Text style={styles.questionText}>{item.question_bn}</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.empty}>{copy.qa.noQuestions}</Text>
        )}
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
        <Pressable accessibilityLabel={copy.qa.sendQuestion} accessibilityRole="button" onPress={submitInput} style={styles.send}>
          <Icon name="send" color={colors.onPrimary} />
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
  messageWrap: {
    maxWidth: "100%"
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
