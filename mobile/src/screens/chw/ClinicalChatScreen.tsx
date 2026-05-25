import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { router } from "expo-router";
import { useNetworkState } from "expo-network";
import { askOnline } from "@/api/chatClient";
import { EmergencyBanner } from "@/components/emergency/EmergencyBanner";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/data/stitchCopy.bn";
import { getQaByTopic, getQaCategories, searchQa, type QaCategory } from "@/features/qa/offlineQaStore";
import { colors, radius, spacing, typography } from "@/theme";
import type { OfflineQa } from "@/types/schema";

type Message = {
  id: string;
  role: "ai" | "user";
  text: string;
  emergency?: boolean;
  timestamp: string;
};

function formatMessageTime(date = new Date()): string {
  return new Intl.DateTimeFormat("bn-BD", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export default function ClinicalChatScreen() {
  const network = useNetworkState();
  const online = network.isConnected !== false && network.isInternetReachable !== false;
  const categories = useMemo(() => getQaCategories(), []);
  const [selectedCategory, setSelectedCategory] = useState<QaCategory | null>(null);
  const [quickReplies, setQuickReplies] = useState<OfflineQa[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: copy.qa.greeting,
      timestamp: formatMessageTime()
    }
  ]);
  const [input, setInput] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);

  useEffect(() => {
    const firstCategory = categories[0] ?? null;
    setSelectedCategory(firstCategory);
    if (!firstCategory) {
      return;
    }
    getQaByTopic({ topic: firstCategory.topic, trimester: "T3" })
      .then((items) => setQuickReplies(items.slice(0, 6)))
      .catch(() => setQuickReplies([]));
  }, [categories]);

  const loadCategory = async (category: QaCategory) => {
    setSelectedCategory(category);
    const items = await getQaByTopic({ topic: category.topic, trimester: "T3" });
    setQuickReplies(items.slice(0, 6));
  };

  const pushMessage = (message: Omit<Message, "id" | "timestamp">) => {
    setMessages((current) => [
      ...current,
      {
        ...message,
        id: `${message.role}-${Date.now()}-${current.length}`,
        timestamp: formatMessageTime()
      }
    ]);
  };

  const askQuestion = async (question: string) => {
    const normalized = question.trim();
    if (!normalized) {
      return;
    }

    pushMessage({ role: "user", text: normalized });
    setLoadingReply(true);

    try {
      if (online) {
        const onlineResponse = await askOnline(normalized);
        if (onlineResponse) {
          pushMessage({
            role: "ai",
            text: onlineResponse.answer,
            emergency: onlineResponse.is_emergency
          });
          return;
        }
      }

      const offlineResults = await searchQa(normalized, "T3");
      if (!offlineResults.length) {
        pushMessage({ role: "ai", text: copy.clinicalChat.noAnswer });
        return;
      }

      const [best] = offlineResults;
      pushMessage({
        role: "ai",
        text: best.answer_bn,
        emergency: best.emergency
      });
    } catch {
      pushMessage({ role: "ai", text: copy.clinicalChat.error });
    } finally {
      setLoadingReply(false);
    }
  };

  const submitInput = async () => {
    const question = input.trim();
    setInput("");
    await askQuestion(question);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Pressable accessibilityLabel={copy.common.back} onPress={goBack} style={styles.iconButton}>
            <Icon color={colors.primary} name="arrow-back" />
          </Pressable>
          <View>
            <Text style={styles.title}>{copy.clinicalChat.title}</Text>
            <View style={[styles.statusBadge, online ? styles.onlineBadge : styles.offlineBadge]}>
              <View style={[styles.statusDot, online ? styles.onlineDot : styles.offlineDot]} />
              <Text style={[styles.statusText, online ? styles.onlineText : styles.offlineText]}>
                {online ? copy.clinicalChat.onlineLabel : copy.clinicalChat.offlineStatus}
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          accessibilityLabel={copy.clinicalChat.urgent}
          onPress={() => {
            const urgentCategory =
              categories.find((item) => item.topic.includes("জরুরি")) ?? selectedCategory;
            if (urgentCategory) {
              loadCategory(urgentCategory).catch(() => undefined);
            }
          }}
          style={styles.urgentButton}
        >
          <Icon color={colors.onErrorContainer} name="warning" size={18} />
          <Text style={styles.urgentText}>{copy.clinicalChat.urgent}</Text>
        </Pressable>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>{copy.clinicalChat.chwMode}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((category) => {
          const active = selectedCategory?.topic === category.topic;
          return (
            <Pressable
              accessibilityLabel={category.label}
              key={category.topic}
              onPress={() => loadCategory(category).catch(() => undefined)}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.messageWrap, item.role === "user" && styles.messageWrapUser]}>
            {item.emergency ? (
              <EmergencyBanner title={copy.qa.highRiskTitle} message={item.text} />
            ) : (
              <View
                style={[
                  styles.bubble,
                  item.role === "user" ? styles.userBubble : styles.aiBubble
                ]}
              >
                <Text style={[styles.bubbleText, item.role === "user" && styles.userBubbleText]}>
                  {item.text}
                </Text>
              </View>
            )}
            <Text style={[styles.timeText, item.role === "user" && styles.userTimeText]}>
              {item.timestamp}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footerWrap}>
            <Text style={styles.quickReplyTitle}>{copy.clinicalChat.quickReplies}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickReplyRow}
            >
              {quickReplies.length ? (
                quickReplies.map((reply) => (
                  <Pressable
                    accessibilityLabel={reply.question_bn}
                    key={reply.id}
                    onPress={() => askQuestion(reply.question_bn)}
                    style={styles.quickReplyChip}
                  >
                    <Text style={styles.quickReplyText}>{reply.question_bn}</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyText}>{copy.clinicalChat.emptyState}</Text>
              )}
            </ScrollView>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel={copy.clinicalChat.inputPlaceholder}
            editable={!loadingReply}
            onChangeText={setInput}
            onSubmitEditing={submitInput}
            placeholder={copy.clinicalChat.inputPlaceholder}
            placeholderTextColor={colors.outline}
            style={styles.input}
            value={input}
          />
          <Pressable
            accessibilityLabel={copy.clinicalChat.send}
            disabled={loadingReply}
            onPress={submitInput}
            style={styles.sendButton}
          >
            <Icon color={colors.onPrimary} name="north-east" size={20} />
          </Pressable>
        </View>
        {!online ? <Text style={styles.offlineLabel}>{copy.clinicalChat.offlineLabel}</Text> : null}
      </View>

      <View pointerEvents="none" style={styles.backgroundPattern} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: 20,
    paddingTop: spacing.base
  },
  topLeft: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: spacing.sm
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 22,
    lineHeight: 30
  },
  statusBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },
  onlineBadge: {
    backgroundColor: colors.secondaryContainer
  },
  offlineBadge: {
    backgroundColor: colors.errorContainer
  },
  statusDot: {
    borderRadius: radius.full,
    height: 8,
    width: 8
  },
  onlineDot: {
    backgroundColor: colors.secondary
  },
  offlineDot: {
    backgroundColor: colors.error
  },
  statusText: {
    ...typography.caption,
    fontFamily: typography.label.fontFamily
  },
  onlineText: {
    color: colors.secondary
  },
  offlineText: {
    color: colors.onErrorContainer
  },
  urgentButton: {
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
    color: colors.onErrorContainer,
    fontFamily: typography.label.fontFamily
  },
  banner: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  bannerText: {
    ...typography.caption,
    color: colors.onPrimaryContainer,
    fontFamily: typography.label.fontFamily,
    textAlign: "center"
  },
  categoryRow: {
    gap: spacing.sm,
    paddingHorizontal: 20,
    paddingVertical: spacing.sm
  },
  categoryChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.base
  },
  categoryChipActive: {
    backgroundColor: colors.primaryFixed
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    fontFamily: typography.label.fontFamily
  },
  categoryChipTextActive: {
    color: colors.primary
  },
  messageList: {
    gap: spacing.base,
    paddingBottom: spacing.base,
    paddingHorizontal: 20
  },
  messageWrap: {
    alignItems: "flex-start",
    marginBottom: spacing.base
  },
  messageWrapUser: {
    alignItems: "flex-end"
  },
  bubble: {
    borderRadius: 16,
    maxWidth: "85%",
    padding: spacing.base
  },
  aiBubble: {
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2
  },
  userBubble: {
    backgroundColor: colors.primary,
    maxWidth: "80%"
  },
  bubbleText: {
    ...typography.body,
    color: colors.onSurface
  },
  userBubbleText: {
    color: colors.onPrimary
  },
  timeText: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginLeft: spacing.xs,
    marginTop: 2
  },
  userTimeText: {
    marginLeft: 0,
    marginRight: spacing.xs,
    textAlign: "right"
  },
  footerWrap: {
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  quickReplyTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  quickReplyRow: {
    gap: spacing.sm
  },
  quickReplyChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.base
  },
  quickReplyText: {
    ...typography.caption,
    color: colors.onSurface
  },
  emptyText: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  inputContainer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopColor: colors.outlineVariant,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm
  },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    color: colors.onSurface,
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.base
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  offlineLabel: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  backgroundPattern: {
    backgroundColor: "transparent",
    bottom: 0,
    left: 0,
    opacity: 0.03,
    position: "absolute",
    right: 0,
    top: 0
  }
});
