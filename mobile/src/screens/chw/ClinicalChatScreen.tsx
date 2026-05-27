import { useCallback, useEffect, useState, useRef } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated
} from "react-native";
import * as Network from "expo-network";
import { router, useFocusEffect } from "expo-router";
import Svg, { Pattern, Circle, Rect } from "react-native-svg";
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
import { EmergencyBanner } from "@/components/emergency/EmergencyBanner";
import { Icon } from "@/components/ui/Icon";
import { notificationTitleForMessage, scheduleLocalNotification } from "@/notifications/notificationService";
import { colors, radius, spacing, typography } from "@/theme";
import { useLanguage } from "@/context/LanguageContext";
import { useCopy } from "@/data/useCopy";
import { formatNumber } from "@/utils/localizedFormat";
import React from "react";

type Mode = "mothers" | "ai";
type AiMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  emergency?: boolean;
  status?: "sending" | "success" | "error";
};

type ClinicalChatResponse = {
  answer: string;
  is_emergency: boolean;
  source: string;
  emergency_text: string | null;
};

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "https://maasheba-backend.onrender.com";

const CHW_CLINICAL_SYSTEM_PROMPT = `You are MaaSheba Clinical AI, a trusted medical support assistant for trained community
health workers (Sasthokormi) in rural Bangladesh. You are NOT talking to a patient.
You are talking to a trained health worker who is doing field visits.

Your role:
- Give clinical decision support: triage guidance, risk assessment, referral advice
- Speak professionally, concisely, in Bangla (Bengali script)
- Use medical terminology appropriate for a trained CHW (BP values, edema, weeks of
  gestation, danger signs, referral criteria)
- When a patient context is provided (name, BP, weeks, symptoms), analyze it clinically
- Follow WHO and DGHS Bangladesh maternal health protocols
- For danger signs (BP ≥ 140/90, severe headache, blurred vision, heavy bleeding,
  fetal movement stopped, seizure): immediately recommend emergency referral
- For moderate risk: recommend monitoring protocol and next visit timing
- For normal findings: confirm and suggest next assessment date
- Never give advice as if speaking to a patient — always address the health worker
- Never use soft reassuring patient language ("আপনার কাছে কী হচ্ছে?" is WRONG)
- Start responses with the clinical finding or action, not pleasantries
- Keep responses under 120 words unless a detailed protocol is needed
- If offline or uncertain: say "তথ্য যাচাই করুন" and give the safest conservative advice`;

const CLINICAL_GUIDE_CARDS = [
  { 
    emoji: "🩺", 
    labelKey: "clinicalBP" as const, 
    queryEn: "What is the emergency triage advice and referral protocol for BP >= 140/90 mmHg during pregnancy?", 
    queryBn: "গর্ভকালীন সময়ে রক্তচাপ ১৪০/৯০ mmHg বা বেশি হলে জরুরি ট্রায়াজ এবং রেফারেল প্রোটোকল কী?"
  },
  { 
    emoji: "🦵", 
    labelKey: "clinicalEdema" as const, 
    queryEn: "Give maternal edema triage grading and danger signs referral protocol.", 
    queryBn: "গর্ভকালীন সময়ে পা ফোলার গ্রেডিং এবং সতর্কতার লক্ষণসহ রেফারেল প্রোটোকলটি বলুন।"
  },
  { 
    emoji: "🩸", 
    labelKey: "clinicalAnemia" as const, 
    queryEn: "What are the WHO hemoglobin cutoffs for mild, moderate, and severe anemia during pregnancy and when to refer?", 
    queryBn: "গর্ভাবস্থায় মৃদু, মাঝারি এবং গুরুতর রক্তশূন্যতার জন্য WHO নির্ধারিত হিমোগ্লোবিন লেভেল কত এবং কখন রেফার করতে হবে?"
  },
  { 
    emoji: "👶", 
    labelKey: "clinicalKickCount" as const, 
    queryEn: "Give fetal movement kick count protocol and danger signs guide.", 
    queryBn: "গর্ভস্থ শিশুর নড়াচড়া (কিক কাউন্ট) পরিমাপের নিয়ম এবং সতর্কতার লক্ষণগুলোর গাইড দিন।"
  },
  { 
    emoji: "📅", 
    labelKey: "clinicalAncVisits" as const, 
    queryEn: "What is the WHO 8-contact antenatal care visit timing and monitoring schedule?", 
    queryBn: "WHO নির্দেশিত গর্ভাবস্থায় ৮টি এএনসি (ANC) ভিজিটের সময়সূচি এবং পর্যবেক্ষণ তালিকাটি বলুন।"
  },
  { 
    emoji: "🚨", 
    labelKey: "clinicalEclampsia" as const, 
    queryEn: "What are the immediate emergency first-aid protocols for eclampsia before referral?", 
    queryBn: "রেফারের আগে গর্ভবতী মায়ের খিঁচুনি (এক্লাম্পসিয়া) হলে তাৎক্ষণিক করণীয় এবং প্রথমিক চিকিৎসা কী?"
  }
] as const;

async function askClinicalOnline(question: string): Promise<ClinicalChatResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        system_prompt: CHW_CLINICAL_SYSTEM_PROMPT
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ClinicalChatResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ----------------------------------------------------
// 2. Custom Styled Memoized Bubble Component
// ----------------------------------------------------
interface CustomBubbleProps {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp?: string;
  status?: "sending" | "success" | "error";
  onRetry?: () => void;
}

const ChatBubbleComponent = React.memo(({ role, text, timestamp, status, onRetry }: CustomBubbleProps) => {
  const bubbleCopy = useCopy();
  const isAi = role === "ai";

  return (
    <View style={[styles.bubbleWrapper, isAi ? styles.bubbleLeft : styles.bubbleRight]}>
      <View
        style={[
          styles.bubbleBase,
          isAi ? styles.bubbleAi : styles.bubbleUser,
          Platform.OS === "android" && isAi ? styles.bubbleShadowAndroid : null
        ]}
      >
        <Text style={[styles.bubbleText, isAi ? styles.bubbleTextAi : styles.bubbleTextUser]}>
          {text}
        </Text>
      </View>

      {/* Timestamp */}
      {timestamp ? (
        <Text style={[styles.timestampText, isAi ? { alignSelf: "flex-start", marginLeft: 4 } : { alignSelf: "flex-end", marginRight: 4 }]}>
          {timestamp}
        </Text>
      ) : null}

      {/* Error State with Retry Button */}
      {status === "error" && (
        <View style={styles.errorPillRow}>
          <View style={styles.errorPill}>
            <Icon name="error" color="#B3261E" size={14} />
            <Text style={styles.errorTextCopy}>{bubbleCopy.clinicalChat.error}</Text>
          </View>
          {onRetry && (
            <Pressable onPress={onRetry} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>{bubbleCopy.clinicalChat.retryText}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
});

ChatBubbleComponent.displayName = "ChatBubbleComponent";

// ----------------------------------------------------
// Animated Dot Typing Indicator
// ----------------------------------------------------
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 250,
            useNativeDriver: true
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true
          }),
          Animated.delay(200)
        ])
      );
    };

    const anim1 = animateDot(dot1, 0);
    const anim2 = animateDot(dot2, 120);
    const anim3 = animateDot(dot3, 240);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={[styles.bubbleWrapper, styles.bubbleLeft]}>
      <View style={[styles.bubbleBase, styles.bubbleAi, styles.typingContainer, Platform.OS === "android" && styles.bubbleShadowAndroid]}>
        <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
        <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
        <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
      </View>
    </View>
  );
};

// ----------------------------------------------------
// Main Chat Screen Component
// ----------------------------------------------------
export default function ClinicalChatScreen() {
  const { language } = useLanguage();
  const copy = useCopy();
  const [mode, setMode] = useState<Mode>("mothers");
  const [chwId, setChwId] = useState<string | null>(null);
  const [mothers, setMothers] = useState<ChatMother[]>([]);
  const [selectedMother, setSelectedMother] = useState<ChatMother | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [category, setCategory] = useState<ChatCategory>("স্বাভাবিক");
  const [online, setOnline] = useState(true);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);

  const categoryLabel = useCallback(
    (item: ChatCategory) => {
      if (language === "bn") return item;
      if (item === "জরুরি") return "Emergency";
      if (item === "স্বাভাবিক") return "Normal";
      if (item === "পুষ্টি") return "Nutrition";
      return "Warning";
    },
    [language]
  );

  // Initialize welcome message once
  useEffect(() => {
    setAiMessages([
      { id: "hello", role: "ai", text: copy.clinicalChat.chatWelcomeAi }
    ]);
  }, [copy.clinicalChat.chatWelcomeAi]);

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

  const submitAiQuestion = async (retryText?: string) => {
    const question = (typeof retryText === "string" ? retryText : aiInput).trim();
    if (!question) return;

    const network = await Network.getNetworkStateAsync();
    const isOnline = Boolean(network.isConnected && network.isInternetReachable !== false);
    setOnline(isOnline);
    if (!isOnline) {
      return;
    }

    if (typeof retryText !== "string") {
      setAiInput("");
    }

    const msgId = `msg-${Date.now()}`;
    const userMsg: AiMessage = {
      id: msgId,
      role: "user",
      text: question,
      status: "sending"
    };

    setAiMessages((current) => {
      const filtered = typeof retryText === "string" ? current.filter((m) => m.text !== retryText) : current;
      return [...filtered, userMsg];
    });

    setIsAiLoading(true);

    try {
      const response = await askClinicalOnline(question);
      if (response) {
        setAiMessages((current) =>
          current.map((m) => (m.id === msgId ? { ...m, status: "success" } : m))
        );
        setAiMessages((current) => [
          ...current,
          {
            id: `ans-${Date.now()}`,
            role: "ai",
            text: response.answer,
            emergency: response.is_emergency
          }
        ]);
      } else {
        throw new Error("No online reply");
      }
    } catch {
      setAiMessages((current) =>
        current.map((m) => (m.id === msgId ? { ...m, status: "error" } : m))
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // ----------------------------------------------------
  // Optimized FlatList stable rendering items
  // ----------------------------------------------------
  const renderMotherItem = useCallback(({ item }: { item: ChatMessage }) => {
    if (item.message_type === "alert") {
      return <EmergencyBanner title={item.category ? categoryLabel(item.category) : copy.common.emergency} message={item.message} />;
    }
    const time = new Date(item.created_at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
    return (
      <ChatBubbleComponent
        id={item.id}
        role={item.sender_type === "chw" ? "user" : "ai"}
        text={item.message}
        timestamp={time}
      />
    );
  }, []);

  const renderAiItem = useCallback(({ item }: { item: AiMessage }) => {
    if (item.emergency) {
      return <EmergencyBanner title={language === "en" ? "Emergency warning" : "জরুরি সতর্কতা"} message={item.text} />;
    }
    const handleRetry = () => {
      void submitAiQuestion(item.text);
    };
    return (
      <ChatBubbleComponent
        id={item.id}
        role={item.role}
        text={item.text}
        status={item.status}
        onRetry={handleRetry}
      />
    );
  }, [aiMessages, selectedMother]);

  const getClinicalChipTemplate = (item: ChatCategory) => {
    if (item === "জরুরি") return copy.clinicalChat.clinicalChipTemplates.urgent;
    if (item === "স্বাভাবিক") return copy.clinicalChat.clinicalChipTemplates.normal;
    if (item === "পুষ্টি") return copy.clinicalChat.clinicalChipTemplates.nutrition;
    return copy.clinicalChat.clinicalChipTemplates.warning;
  };

  const motherKeyExtractor = useCallback((item: ChatMessage) => item.id, []);
  const aiKeyExtractor = useCallback((item: AiMessage) => item.id, []);

  // ----------------------------------------------------
  // Render Food Cards List (Stitch suggestion cards)
  // ----------------------------------------------------
  const renderClinicalGuideCards = () => {
    const isAiWelcomeOnly = aiMessages.length <= 1;
    if (!isAiWelcomeOnly) return null;

    return (
      <View style={styles.foodCardsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foodCardsScroll}>
          {CLINICAL_GUIDE_CARDS.map((item) => {
            const guideLabel = copy.clinicalChat[item.labelKey];
            return (
              <Pressable
                accessibilityLabel={guideLabel}
                key={item.labelKey}
                onPress={() => {
                  if (!online) return;
                  const queryText = language === "en" ? item.queryEn : item.queryBn;
                  void submitAiQuestion(queryText);
                }}
                style={({ pressed }) => [
                  styles.foodCard,
                  Platform.OS === "android" && styles.bubbleShadowAndroid,
                  pressed && styles.foodCardPressed
                ]}
              >
                <Text style={styles.foodCardEmoji}>{item.emoji}</Text>
                <Text style={styles.foodCardLabel} numberOfLines={2}>{guideLabel}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // ----------------------------------------------------
  // Render Quick Replies Categories List
  // ----------------------------------------------------
  const renderQuickReplies = () => {
    const chips: ChatCategory[] = ["জরুরি", "স্বাভাবিক", "পুষ্টি", "সতর্কতা"];
    return (
      <View style={styles.chipsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {chips.map((item) => {
            const isActive = mode === "mothers" ? category === item : false;
            const handleChipPress = () => {
              if (mode === "mothers") {
                setCategory(item);
                setMessageInput(item);
              } else {
                if (!online) return;
                setAiInput(getClinicalChipTemplate(item));
              }
            };
            return (
              <Pressable
                accessibilityLabel={categoryLabel(item)}
                key={item}
                onPress={handleChipPress}
                style={[
                  styles.chip,
                  isActive ? styles.chipActive : styles.chipInactive
                ]}
              >
                <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
                  {categoryLabel(item)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // ----------------------------------------------------
  // Center Empty Card Component
  // ----------------------------------------------------
  const renderEmptyCard = () => {
    return (
      <View style={styles.emptyCardContainer}>
        <View style={styles.emptyCard}>
          <View style={styles.sparkleIconContainer}>
            <Icon name="auto-awesome" color="#96482e" size={28} />
          </View>
          <Text style={styles.emptyGreeting}>
            {copy.clinicalChat.emptyStateGreeting}
          </Text>
          <Text style={styles.emptyInstruction}>
            {copy.clinicalChat.emptyStateInstruction}
          </Text>
        </View>
      </View>
    );
  };

  const isMotherEmpty = messages.length === 0;
  const isAiEmpty = aiMessages.length <= 1 && !isAiLoading;

  return (
    <View style={styles.screen}>
      {/* Repeating Dot Grid Pattern Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" opacity={0.03}>
          <Pattern id="dotPattern" width={24} height={24} patternUnits="userSpaceOnUse">
            <Circle cx={1.5} cy={1.5} r={1.5} fill="#96482e" />
          </Pattern>
          <Rect width="100%" height="100%" fill="url(#dotPattern)" />
        </Svg>
      </View>

      {/* Top Header App bar: compact h:56px */}
      <View style={styles.topBar}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{copy.clinicalChat.title}</Text>
          <View style={[styles.statusPill, online ? styles.statusPillOnline : styles.statusPillOffline]}>
            <View style={[styles.statusDot, online ? styles.statusDotOnline : styles.statusDotOffline]} />
            <Text style={[styles.statusPillText, online ? styles.statusTextOnline : styles.statusTextOffline]}>
              {online ? copy.common.online : copy.common.offline}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/home")} style={styles.homeButton}>
          <Icon name="home" color="#70605A" size={24} />
        </Pressable>
      </View>

      <View style={styles.modeTabs}>
        <ModeButton active={mode === "mothers"} label={language === "en" ? "Mothers" : "মায়েরা"} onPress={() => setMode("mothers")} />
        <ModeButton active={mode === "ai"} label="CHW AI" onPress={() => setMode("ai")} />
      </View>

      {mode === "mothers" ? (
        <View style={styles.chatLayout}>
          <View style={{ height: 60, paddingVertical: 4 }}>
            <FlatList
              disableVirtualization
              data={mothers}
              horizontal
              showsHorizontalScrollIndicator={false}
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
                    {language === "en" ? "Week" : "সপ্তাহ"} {formatNumber(item.gestational_age_weeks ?? item.patient?.gestational_age_weeks ?? 0, language)}
                  </Text>
                </Pressable>
              )}
            />
          </View>

          {isMotherEmpty && selectedMother ? (
            renderEmptyCard()
          ) : (
            <FlatList
              disableVirtualization
              data={selectedMother ? messages : []}
              keyExtractor={motherKeyExtractor}
              renderItem={renderMotherItem}
              contentContainerStyle={styles.messageList}
              removeClippedSubviews={true}
              maxToRenderPerBatch={8}
              windowSize={5}
            />
          )}

          {/* Quick replies chips above input bar */}
          {renderQuickReplies()}

          <View style={styles.inputRow}>
            <TextInput
              onChangeText={setMessageInput}
              onSubmitEditing={submitMotherMessage}
              placeholder={language === "en" ? "Write a message to the mother..." : "মাকে বার্তা লিখুন..."}
              placeholderTextColor="#A08E88"
              style={styles.input}
              value={messageInput}
            />
            <Pressable onPress={submitMotherMessage} style={styles.sendButton}>
              <Icon name="send" color="#FFFFFF" size={20} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.chatLayout}>
          {!online ? (
            <View style={styles.offlineBanner}>
              <Icon name="wifi-off" color="#ba1a1a" size={20} />
              <Text style={styles.offlineTitle}>{copy.clinicalChat.clinicalAiOfflineRequired}</Text>
            </View>
          ) : null}

          {isAiEmpty ? (
            renderEmptyCard()
          ) : (
            <FlatList
              disableVirtualization
              data={aiMessages}
              keyExtractor={aiKeyExtractor}
              renderItem={renderAiItem}
              contentContainerStyle={styles.messageList}
              removeClippedSubviews={true}
              maxToRenderPerBatch={8}
              windowSize={5}
              ListFooterComponent={isAiLoading ? <TypingIndicator /> : null}
            />
          )}

          {/* Food Cards & Quick replies chips stacked above input bar */}
          {renderClinicalGuideCards()}
          {renderQuickReplies()}

          <View style={styles.inputRow}>
            <TextInput
              editable={online}
              onChangeText={setAiInput}
              onSubmitEditing={() => void submitAiQuestion()}
              placeholder={copy.clinicalChat.clinicalInputPlaceholder}
              placeholderTextColor="#A08E88"
              style={[styles.input, !online && styles.inputDisabled]}
              value={aiInput}
            />
            <Pressable disabled={!online} onPress={() => void submitAiQuestion()} style={[styles.sendButton, !online && styles.sendDisabled]}>
              <Icon name="send" color="#FFFFFF" size={20} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function ModeButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}>
      <Text style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ----------------------------------------------------
// 5. CSS Stylesheet (Stitch visual mappings)
// ----------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FDF8F3", // Warm cream stitch bg
    flex: 1
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "#FFF9F6",
    borderBottomColor: "#F5ECE9",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    height: 56, // Compact height exactly 56px
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 0, android: 0, default: 0 }),
    marginTop: Platform.select({ ios: 48, android: 24, default: 12 })
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerTitle: {
    color: "#70605A",
    fontSize: 20, // Compact size
    fontWeight: "bold",
    fontFamily: "Hind Siliguri"
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1
  },
  statusPillOnline: {
    backgroundColor: "#EBF5E9",
    borderColor: "#CDEBC4"
  },
  statusPillOffline: {
    backgroundColor: "#F5F0EB",
    borderColor: "#DAC1BA"
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusDotOnline: {
    backgroundColor: "#4B6546"
  },
  statusDotOffline: {
    backgroundColor: "#87726c"
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: "bold",
    fontFamily: "Hind Siliguri"
  },
  statusTextOnline: {
    color: "#4B6546"
  },
  statusTextOffline: {
    color: "#87726c"
  },
  homeButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
    backgroundColor: "#FCEBE5"
  },
  modeTabs: {
    backgroundColor: "#FCEBE5",
    borderRadius: 24,
    flexDirection: "row",
    gap: 4,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 4
  },
  modeButton: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    minHeight: 36,
    justifyContent: "center"
  },
  modeButtonActive: {
    backgroundColor: "#E57A58"
  },
  modeButtonText: {
    color: "#70605A",
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: "Hind Siliguri"
  },
  modeButtonTextActive: {
    color: "#FFFFFF"
  },
  chatLayout: {
    flex: 1,
    gap: spacing.xs
  },
  motherList: {
    gap: 8,
    paddingHorizontal: 16
  },
  motherChip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 110,
    height: 52,
    paddingHorizontal: 12,
    justifyContent: "center"
  },
  motherChipActive: {
    backgroundColor: "#E57A58",
    borderColor: "#E57A58"
  },
  motherChipText: {
    color: "#4A3E39",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Hind Siliguri"
  },
  motherChipTextActive: {
    color: "#FFFFFF"
  },
  motherWeek: {
    color: "#70605A",
    fontSize: 10,
    marginTop: 2,
    fontFamily: "Hind Siliguri"
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 144, // pb = inputHeight + chipsHeight + 16px
    gap: 12
  },

  // ----------------------------------------------------
  // Bubble Layout & Shadow Configurations
  // ----------------------------------------------------
  bubbleWrapper: {
    marginVertical: 4,
    width: "100%"
  },
  bubbleLeft: {
    alignItems: "flex-start"
  },
  bubbleRight: {
    alignItems: "flex-end"
  },
  bubbleBase: {
    borderRadius: 16,
    padding: 12,
    elevation: 0
  },
  bubbleAi: {
    backgroundColor: "#FFFFFF",
    maxWidth: "85%",
    borderBottomLeftRadius: 4, // Stitch tail styling
    // Premium iOS Shadow configuration
    shadowColor: "#e8896a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20
  },
  bubbleShadowAndroid: {
    elevation: 2,
    shadowColor: "#e8896a"
  },
  bubbleUser: {
    backgroundColor: "#96482e", // Stitch primary
    maxWidth: "80%",
    borderBottomRightRadius: 4
  },
  bubbleText: {
    fontSize: 17,
    fontFamily: "Hind Siliguri",
    lineHeight: 24
  },
  bubbleTextAi: {
    color: "#1d1b19" // Stitch on-surface
  },
  bubbleTextUser: {
    color: "#FFFFFF"
  },
  timestampText: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
    marginTop: 4,
    fontFamily: "Hind Siliguri"
  },

  // ----------------------------------------------------
  // Typing Indicator dots styles
  // ----------------------------------------------------
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minWidth: 64,
    justifyContent: "center"
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#96482e"
  },

  // ----------------------------------------------------
  // Error Pills & Retry Flows
  // ----------------------------------------------------
  errorPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    alignSelf: "flex-end"
  },
  errorPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFDAD6", // errorContainer
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  errorTextCopy: {
    fontSize: 10,
    color: "#93000a", // onErrorContainer
    fontFamily: "Hind Siliguri"
  },
  retryBtn: {
    backgroundColor: "#FCEBE5",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#dac1ba"
  },
  retryBtnText: {
    fontSize: 10,
    color: "#96482e",
    fontWeight: "bold",
    fontFamily: "Hind Siliguri"
  },

  // ----------------------------------------------------
  // Centering Empty Card Layouts
  // ----------------------------------------------------
  emptyCardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: 40
  },
  emptyCard: {
    backgroundColor: "rgba(232, 137, 106, 0.15)", // primaryContainer/15
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(232, 137, 106, 0.25)"
  },
  sparkleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#e8896a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  emptyGreeting: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#96482e",
    textAlign: "center",
    fontFamily: "Hind Siliguri",
    lineHeight: 22
  },
  emptyInstruction: {
    fontSize: 12,
    color: "#70605A",
    textAlign: "center",
    fontFamily: "Hind Siliguri",
    lineHeight: 18,
    paddingHorizontal: 8
  },

  // ----------------------------------------------------
  // Horizontal Quick Reply Chips Row
  // ----------------------------------------------------
  chipsWrapper: {
    position: "absolute",
    bottom: 80, // Sits directly above input bar
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingVertical: 6
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    height: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  chipInactive: {
    backgroundColor: "#F8F3EE", // surfaceContainerLow
    borderColor: "rgba(218, 193, 186, 0.3)" // outlineVariant/30
  },
  chipActive: {
    backgroundColor: "#E8896A", // primaryContainer
    borderColor: "#E8896A"
  },
  chipText: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Hind Siliguri"
  },
  chipTextInactive: {
    color: "#70605A"
  },
  chipTextActive: {
    color: "#65230C" // onPrimaryContainer
  },

  // ----------------------------------------------------
  // Horizontal Food Baby suggestion Cards Row
  // ----------------------------------------------------
  foodCardsWrapper: {
    position: "absolute",
    bottom: 118, // Sits directly above quick chips row
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingVertical: 4
  },
  foodCardsScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  foodCard: {
    width: 64,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    gap: 4,
    shadowColor: "#e8896a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20
  },
  foodCardPressed: {
    opacity: 0.7,
    backgroundColor: "#FCEBE5"
  },
  foodCardEmoji: {
    fontSize: 24
  },
  foodCardLabel: {
    fontSize: 10,
    color: "#1D1B19",
    fontFamily: "Hind Siliguri",
    textAlign: "center",
    lineHeight: 12
  },

  // Input styling
  inputRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopColor: "#F5ECE9",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 16,
    height: 80 // Input bar height 80px
  },
  input: {
    backgroundColor: "#F2EBE8",
    borderRadius: 24,
    color: "#4A3E39",
    flex: 1,
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 16,
    fontFamily: "Hind Siliguri"
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
    backgroundColor: "#ffdad6",
    borderRadius: 12,
    flexDirection: "column",
    gap: 8,
    justifyContent: "center",
    marginHorizontal: 16,
    padding: 16
  },
  offlineTitle: {
    ...typography.label,
    color: "#ba1a1a",
    fontFamily: typography.h2.fontFamily,
    textAlign: "center"
  }
});
