import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Network from "expo-network";
import { router, useFocusEffect } from "expo-router";
import { askOnline } from "@/api/chatClient";
import {
  getMessages,
  listAssignedMothers,
  markMessagesRead,
  sendMessage,
  subscribeToMessages,
  type ChatCategory,
  type ChatMessage,
  type ChatMother
} from "@/api/chatService";
import { getSession } from "@/auth/secureSession";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { EmergencyBanner } from "@/components/emergency/EmergencyBanner";
import { Icon } from "@/components/ui/Icon";
import { notificationTitleForMessage, scheduleLocalNotification } from "@/notifications/notificationService";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";

type Mode = "mothers" | "ai";
type AiMessage = { id: string; role: "user" | "ai"; text: string; emergency?: boolean };

const categories: ChatCategory[] = ["জরুরি", "স্বাভাবিক", "পুষ্টি", "সতর্কতা"];

export default function ClinicalChatScreen() {
  const [mode, setMode] = useState<Mode>("mothers");
  const [chwId, setChwId] = useState<string | null>(null);
  const [mothers, setMothers] = useState<ChatMother[]>([]);
  const [selectedMother, setSelectedMother] = useState<ChatMother | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [category, setCategory] = useState<ChatCategory>("স্বাভাবিক");
  const [online, setOnline] = useState(true);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    { id: "hello", role: "ai", text: "স্বাস্থ্যকর্মী AI প্রস্তুত। রোগীর BP, সপ্তাহ, লক্ষণ বা রেফারেল নিয়ে প্রশ্ন করুন।" }
  ]);

  const load = useCallback(async () => {
    const session = await getSession();
    if (!session) return;
    setChwId(session.chwId);
    const [network, assignedMothers] = await Promise.all([
      Network.getNetworkStateAsync(),
      listAssignedMothers(session.chwId).catch(() => [])
    ]);
    setOnline(Boolean(network.isConnected && network.isInternetReachable !== false));
    setMothers(assignedMothers);
    if (!selectedMother && assignedMothers[0]) setSelectedMother(assignedMothers[0]);
  }, [selectedMother]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load])
  );

  useEffect(() => {
    if (!chwId || !selectedMother) return undefined;
    getMessages(chwId, selectedMother.id)
      .then((rows) => {
        setMessages(rows);
        return markMessagesRead(chwId, selectedMother.id, "chw");
      })
      .catch(() => setMessages([]));

    const channel = subscribeToMessages(chwId, selectedMother.id, (message) => {
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      if (message.sender_type === "mother") {
        scheduleLocalNotification({
          title: notificationTitleForMessage(message),
          body: message.message,
          category: message.category,
          data: { chwId, motherId: selectedMother.id }
        }).catch(() => undefined);
      }
    });
    return () => {
      channel.unsubscribe();
    };
  }, [chwId, selectedMother]);

  const submitMotherMessage = async () => {
    if (!chwId || !selectedMother || !messageInput.trim()) return;
    const text = messageInput.trim();
    setMessageInput("");
    try {
      const sent = await sendMessage({
        chwId,
        motherId: selectedMother.id,
        senderType: "chw",
        senderId: chwId,
        message: text,
        category
      });
      setMessages((current) => [...current, sent]);
    } catch {
      Alert.alert("বার্তা পাঠানো যায়নি", "ইন্টারনেট বা ডাটাবেস সংযোগ পরীক্ষা করুন।", [{ text: "ঠিক আছে" }]);
    }
  };

  const submitAiQuestion = async () => {
    const question = aiInput.trim();
    if (!question || !online) return;
    setAiInput("");
    setAiMessages((current) => [...current, { id: `q-${Date.now()}`, role: "user", text: question }]);
    const response = await askOnline(`[CHW clinical context] ${question}`);
    setAiMessages((current) => [
      ...current,
      {
        id: `a-${Date.now()}`,
        role: "ai",
        text: response?.answer ?? "অনলাইন AI উত্তর পাওয়া যায়নি। জরুরি হলে রোগীকে দ্রুত রেফার করুন।",
        emergency: response?.is_emergency
      }
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>চ্যাট</Text>
        <Pressable onPress={() => router.push("/(tabs)/home")} style={styles.homeButton}>
          <Icon name="home" color="#70605A" />
        </Pressable>
      </View>

      <View style={styles.modeTabs}>
        <ModeButton active={mode === "mothers"} label="মায়েরা" onPress={() => setMode("mothers")} />
        <ModeButton active={mode === "ai"} label="CHW AI" onPress={() => setMode("ai")} />
      </View>

      {mode === "mothers" ? (
        <View style={styles.chatLayout}>
          <FlatList
            data={mothers}
            horizontal
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.motherList}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedMother(item)}
                style={[styles.motherChip, selectedMother?.id === item.id && styles.motherChipActive]}
              >
                <Text style={[styles.motherChipText, selectedMother?.id === item.id && styles.motherChipTextActive]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.motherWeek, selectedMother?.id === item.id && styles.motherChipTextActive]}>
                  সপ্তাহ {toBanglaNumber(item.gestational_age_weeks ?? item.patient?.gestational_age_weeks ?? 0)}
                </Text>
              </Pressable>
            )}
          />

          <ScrollView contentContainerStyle={styles.messageList}>
            {selectedMother ? (
              <>
                <Text style={styles.conversationTitle}>{selectedMother.name}</Text>
                {messages.map((message) =>
                  message.message_type === "alert" ? (
                    <EmergencyBanner key={message.id} title={message.category ?? "জরুরি"} message={message.message} />
                  ) : (
                    <ChatBubble key={message.id} role={message.sender_type === "chw" ? "user" : "ai"} text={message.message} />
                  )
                )}
                {!messages.length ? <Text style={styles.emptyText}>এখনও কোনো বার্তা নেই।</Text> : null}
              </>
            ) : (
              <Text style={styles.emptyText}>এই CHW-এর জন্য কোনো মা পাওয়া যায়নি।</Text>
            )}
          </ScrollView>

          <View style={styles.categoryRow}>
            {categories.map((item) => (
              <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}>
                <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              onChangeText={setMessageInput}
              onSubmitEditing={submitMotherMessage}
              placeholder="মাকে বার্তা লিখুন..."
              placeholderTextColor="#A08E88"
              style={styles.input}
              value={messageInput}
            />
            <Pressable onPress={submitMotherMessage} style={styles.sendButton}>
              <Icon name="send" color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.chatLayout}>
          {!online ? (
            <View style={styles.offlineBanner}>
              <Icon name="wifi-off" color="#B3261E" />
              <View style={styles.offlineTextWrap}>
                <Text style={styles.offlineTitle}>স্বাস্থ্যকর্মী AI-এর জন্য ইন্টারনেট সংযোগ প্রয়োজন।</Text>
                <Text style={styles.offlineBody}>অফলাইনে শুধু ওষুধ তথ্য ব্যবহার করুন।</Text>
              </View>
              <Pressable onPress={() => router.push("/(tabs)/medicine")} style={styles.medicineLink}>
                <Text style={styles.medicineLinkText}>ওষুধ</Text>
              </Pressable>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={styles.messageList}>
            {aiMessages.map((message) =>
              message.emergency ? (
                <EmergencyBanner key={message.id} title="জরুরি সতর্কতা" message={message.text} />
              ) : (
                <ChatBubble key={message.id} role={message.role} text={message.text} />
              )
            )}
          </ScrollView>
          <View style={styles.inputRow}>
            <TextInput
              editable={online}
              onChangeText={setAiInput}
              onSubmitEditing={submitAiQuestion}
              placeholder={online ? "ক্লিনিক্যাল প্রশ্ন লিখুন..." : "ইন্টারনেট নেই"}
              placeholderTextColor="#A08E88"
              style={[styles.input, !online && styles.inputDisabled]}
              value={aiInput}
            />
            <Pressable disabled={!online} onPress={submitAiQuestion} style={[styles.sendButton, !online && styles.sendDisabled]}>
              <Icon name="send" color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function ModeButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}>
      <Text style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFF9F6",
    flex: 1
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "#FFF9F6",
    borderBottomColor: "#F5ECE9",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 52, android: 56, default: 16 })
  },
  headerTitle: {
    color: "#70605A",
    fontSize: 22,
    fontWeight: "bold"
  },
  homeButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  modeTabs: {
    backgroundColor: "#FCEBE5",
    borderRadius: 24,
    flexDirection: "row",
    gap: 4,
    margin: 16,
    padding: 4
  },
  modeButton: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    minHeight: 40,
    justifyContent: "center"
  },
  modeButtonActive: {
    backgroundColor: "#E57A58"
  },
  modeButtonText: {
    color: "#70605A",
    fontSize: 14,
    fontWeight: "bold"
  },
  modeButtonTextActive: {
    color: "#FFFFFF"
  },
  chatLayout: {
    flex: 1,
    gap: spacing.sm
  },
  motherList: {
    gap: 10,
    paddingHorizontal: 16
  },
  motherChip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 140,
    padding: 12
  },
  motherChipActive: {
    backgroundColor: "#E57A58",
    borderColor: "#E57A58"
  },
  motherChipText: {
    color: "#4A3E39",
    fontSize: 14,
    fontWeight: "bold"
  },
  motherChipTextActive: {
    color: "#FFFFFF"
  },
  motherWeek: {
    color: "#70605A",
    fontSize: 12,
    marginTop: 3
  },
  messageList: {
    gap: spacing.sm,
    padding: 16,
    paddingBottom: 20
  },
  conversationTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  emptyText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16
  },
  category: {
    backgroundColor: "#F2E8E4",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  categoryActive: {
    backgroundColor: "#70605A"
  },
  categoryText: {
    color: "#70605A",
    fontSize: 12,
    fontWeight: "bold"
  },
  categoryTextActive: {
    color: "#FFFFFF"
  },
  inputRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopColor: "#F5ECE9",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 16
  },
  input: {
    backgroundColor: "#F2EBE8",
    borderRadius: 24,
    color: "#4A3E39",
    flex: 1,
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 16
  },
  inputDisabled: {
    opacity: 0.55
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  sendDisabled: {
    opacity: 0.55
  },
  offlineBanner: {
    alignItems: "center",
    backgroundColor: "#FCEBE5",
    borderColor: "#F2B8B5",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: 16,
    padding: spacing.base
  },
  offlineTextWrap: {
    flex: 1
  },
  offlineTitle: {
    ...typography.label,
    color: colors.error,
    fontFamily: typography.h2.fontFamily
  },
  offlineBody: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  medicineLink: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  medicineLinkText: {
    color: "#B3261E",
    fontSize: 12,
    fontWeight: "bold"
  }
});
