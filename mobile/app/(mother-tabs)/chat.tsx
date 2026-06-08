import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { getCurrentMotherProfile } from "@/auth/roleSession";
import { supabase } from "@/auth/supabaseAuth";
import { getMessages, markMessagesRead, sendMessage, subscribeToMessages, type ChatMessage } from "@/api/chatService";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { EmergencyBanner } from "@/components/emergency/EmergencyBanner";
import { Icon } from "@/components/ui/Icon";
import { QaChatScreen } from "@/features/qa/QaChatScreen";
import { notificationTitleForMessage, scheduleLocalNotification } from "@/notifications/notificationService";
import { colors, radius, spacing, typography } from "@/theme";
import { useLanguage } from "@/context/LanguageContext";

type Mode = "ai" | "chw";

export default function MotherChatScreen() {
  const { language } = useLanguage();
  const [mode, setMode] = useState<Mode>("ai");
  const [motherId, setMotherId] = useState<string | null>(null);
  const [chwId, setChwId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const load = useCallback(async () => {
    const profile = await getCurrentMotherProfile();
    if (!profile) return;
    setMotherId(profile.id);

    // Support demo mother ID bypass
    const DEMO_PATIENT_ID = "11111111-1111-1111-1111-111111111102";
    const DEMO_CHW_ID = "00000000-0000-0000-0000-0000000000a1";
    if (profile.id === "60000000-0000-0000-0000-000000000002" || profile.patientId === DEMO_PATIENT_ID) {
      setChwId(DEMO_CHW_ID);
      return;
    }

    if (profile.patientId) {
      const { data } = await supabase
        .from("patients")
        .select("chw_id")
        .eq("id", profile.patientId)
        .maybeSingle<{ chw_id: string }>();
      if (data?.chw_id) {
        setChwId(data.chw_id);
        return;
      }
    }

    // Fallback: Check connection_requests to see if a CHW is assigned to this mother
    try {
      const { data } = await supabase
        .from("connection_requests")
        .select("chw_id")
        .eq("mother_id", profile.id)
        .eq("status", "assigned")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.chw_id) {
        setChwId(data.chw_id);
      }
    } catch (err) {
      console.warn("Failed to retrieve fallback chw_id from connection_requests:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load])
  );

  useEffect(() => {
    if (!chwId || !motherId || mode !== "chw") return undefined;
    getMessages(chwId, motherId)
      .then((rows) => {
        setMessages(rows);
        return markMessagesRead(chwId, motherId, "mother");
      })
      .catch(() => setMessages([]));
    const channel = subscribeToMessages(chwId, motherId, (message) => {
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      if (message.sender_type === "chw") {
        scheduleLocalNotification({
          title: notificationTitleForMessage(message),
          body: message.message,
          category: message.category,
          data: { chwId, motherId }
        }).catch(() => undefined);
      }
    });
    return () => {
      channel.unsubscribe();
    };
  }, [chwId, motherId, mode]);

  const submit = async () => {
    if (!chwId || !motherId || !input.trim()) return;
    const text = input.trim();
    setInput("");
    try {
      const sent = await sendMessage({
        chwId,
        motherId,
        senderType: "mother",
        senderId: motherId,
        message: text
      });
      setMessages((current) => [...current, sent]);
    } catch {
      Alert.alert(language === "en" ? "Message not sent" : "বার্তা পাঠানো যায়নি", language === "en" ? "Check your internet or database connection." : "ইন্টারনেট বা ডাটাবেস সংযোগ পরীক্ষা করুন।", [
        { text: language === "en" ? "OK" : "ঠিক আছে" }
      ]);
    }
  };

  if (mode === "ai") {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <TopTabs active={mode} onChange={setMode} />
        <View style={styles.aiWrap}>
          <QaChatScreen />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <TopTabs active={mode} onChange={setMode} />
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/(mother-tabs)/home")} style={styles.backButton}>
          <Icon name="arrow-back" color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{language === "en" ? "Health worker" : "স্বাস্থ্যকর্মী"}</Text>
          <Text style={styles.subtitle}>{language === "en" ? "Send a direct message" : "সরাসরি বার্তা পাঠান"}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.messages}>
        {chwId && motherId ? (
          messages.length ? (
            messages.map((message) =>
              message.message_type === "alert" ? (
                <EmergencyBanner key={message.id} title={message.category ?? (language === "en" ? "Emergency" : "জরুরি")} message={message.message} />
              ) : (
                <ChatBubble key={message.id} role={message.sender_type === "mother" ? "user" : "ai"} text={message.message} />
              )
            )
          ) : (
            <Text style={styles.empty}>{language === "en" ? "No messages yet." : "এখনও কোনো বার্তা নেই।"}</Text>
          )
        ) : (
          <Text style={styles.empty}>
            {language === "en" ? "Health worker connection was not found. Check login or internet connection." : "স্বাস্থ্যকর্মী সংযোগ পাওয়া যায়নি। লগইন বা ইন্টারনেট সংযোগ পরীক্ষা করুন।"}
          </Text>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          editable={Boolean(chwId && motherId)}
          onChangeText={setInput}
          onSubmitEditing={submit}
          placeholder={language === "en" ? "Write a message..." : "বার্তা লিখুন..."}
          placeholderTextColor="#A08E88"
          style={styles.input}
          value={input}
        />
        <Pressable onPress={submit} style={styles.sendButton}>
          <Icon name="send" color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function TopTabs({ active, onChange }: { active: Mode; onChange: (mode: Mode) => void }) {
  const { language } = useLanguage();
  return (
    <View style={styles.tabs}>
      <Pressable onPress={() => onChange("ai")} style={[styles.tab, active === "ai" && styles.tabActive]}>
        <Text style={[styles.tabText, active === "ai" && styles.tabTextActive]}>{language === "en" ? "MaaSheba AI" : "মাশেবা AI"}</Text>
      </Pressable>
      <Pressable onPress={() => onChange("chw")} style={[styles.tab, active === "chw" && styles.tabActive]}>
        <Text style={[styles.tabText, active === "chw" && styles.tabTextActive]}>{language === "en" ? "Health worker" : "স্বাস্থ্যকর্মী"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFF9F6",
    flex: 1
  },
  aiWrap: {
    flex: 1
  },
  tabs: {
    backgroundColor: "#FCEBE5",
    borderRadius: 24,
    flexDirection: "row",
    gap: 4,
    margin: 16,
    padding: 4
  },
  tab: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    minHeight: 42,
    justifyContent: "center"
  },
  tabActive: {
    backgroundColor: "#E57A58"
  },
  tabText: {
    color: "#70605A",
    fontWeight: "bold"
  },
  tabTextActive: {
    color: "#FFFFFF"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.marginMobile
  },
  backButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  headerText: {
    flex: 1
  },
  title: {
    ...typography.h2,
    color: colors.onSurface
  },
  subtitle: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  messages: {
    gap: spacing.sm,
    padding: spacing.marginMobile
  },
  empty: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  inputRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopColor: "#F5ECE9",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.base
  },
  input: {
    ...typography.body,
    backgroundColor: "#F2EBE8",
    borderRadius: radius.full,
    color: colors.onSurface,
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.base
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48
  }
});
