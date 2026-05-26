import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { router } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/data/stitchCopy.bn";
import { colors, radius, spacing, typography } from "@/theme";

type Message = {
  id: string;
  role: "ai" | "user";
  text: string;
  type?: "text" | "checklist" | "referral";
  timestamp: string;
};

export default function ClinicalChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg1",
      role: "ai",
      type: "text",
      text: "আসসালামু আলাইকুম, রাহেলা আপা। আপনার ফিল্ড ভিজিটের জন্য আমি তৈরি। ফাতেমা বেগম (ID: 4421) জরুরি ট্রায়াজে আছেন। তার শেষ BP ছিল ১৫০/১০০ mmHg। মূল্যায়ন কি শুরু করবো?",
      timestamp: "১০:০২ AM"
    },
    {
      id: "msg2",
      role: "user",
      type: "text",
      text: "হ্যাঁ, শুরু করো।",
      timestamp: "১০:০৩ AM"
    },
    {
      id: "msg3",
      role: "ai",
      type: "checklist",
      text: "",
      timestamp: "১০:০৪ AM"
    },
    {
      id: "msg4",
      role: "ai",
      type: "referral",
      text: "",
      timestamp: "১০:০৪ AM"
    }
  ]);

  const [input, setInput] = useState("");
  
  // Checklist Interactive State
  const [checklist, setChecklist] = useState([
    { id: 1, text: "BP পুনরায় পরীক্ষা করুন (বিশ্রামের পর)", checked: true },
    { id: 2, text: "পায়ে পানি বা এডিমা আছে কি?", checked: false },
    { id: 3, text: "তীব্র মাথাব্যথা বা ঝাপসা দৃষ্টি?", checked: false }
  ]);

  const toggleChecklist = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const pushMessage = (text: string, role: "ai" | "user") => {
    const time = new Date().toLocaleTimeString("bn-BD", {
      hour: "numeric",
      minute: "2-digit"
    });
    setMessages((prev) => [
      ...prev,
      {
        id: `${role}-${Date.now()}`,
        role,
        type: "text",
        text,
        timestamp: time
      }
    ]);
  };

  const submitInput = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    pushMessage(text, "user");

    // Interactive AI response delay
    setTimeout(() => {
      let reply = "রোগীর অবস্থা পর্যবেক্ষণ করা হচ্ছে। প্রয়োজনীয় সেবা ও রেফারেল নিশ্চিত করুন।";
      const q = text.toLowerCase();
      if (q.includes("hi") || q.includes("hello") || q.includes("আসসালামু")) {
        reply = "আসসালামু আলাইকুম, রাহেলা আপা। গর্ভবতী মায়ের সেবা সংক্রান্ত যেকোনো জিজ্ঞাসায় আমি আপনাকে সাহায্য করতে প্রস্তুত।";
      } else if (q.includes("refer") || q.includes("রেফার")) {
        reply = "নিকটস্থ উপজেলা স্বাস্থ্য কমপ্লেক্সে রেফারেল স্লিপ তৈরি করে রোগীকে দ্রুত স্থানান্তরের ব্যবস্থা করুন।";
      }
      pushMessage(reply, "ai");
    }, 1200);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/home");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      {/* Premium Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Pressable accessibilityLabel={copy.common.back} onPress={goBack} style={styles.backButton}>
            <Icon color="#70605A" name="arrow-back" size={24} />
          </Pressable>
          
          {/* Circular Clinician Profile Avatar */}
          <View style={styles.avatarContainer}>
            <Icon color="#FFFFFF" name="person" size={20} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{copy.common.appName}</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>অনলাইন</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => Alert.alert("🚨 জরুরি পরিস্থিতি", "রোগীর অবস্থা জটিল। অনুগ্রহ করে দ্রুত পরবর্তী ব্যবস্থা নিন।")}
          style={styles.urgentButton}
        >
          <Icon color="#B3261E" name="warning" size={14} />
          <Text style={styles.urgentText}>জরুরি</Text>
        </Pressable>
      </View>

      {/* Terracotta Mode Subheader Strip */}
      <View style={styles.modeStrip}>
        <Icon color="#FFFFFF" name="add-box" size={18} />
        <Text style={styles.modeStripText}>স্বাস্থ্যকর্মী মোড — ক্লিনিক্যাল সহায়তা সক্রিয়</Text>
      </View>

      {/* Message Feed */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => {
          if (item.type === "checklist") {
            return (
              <View style={styles.messageWrap}>
                <View style={styles.checklistCard}>
                  <View style={styles.checklistHeader}>
                    <View style={styles.checklistHeaderLeft}>
                      <Text style={styles.checklistTitle}>মূল্যায়ন চেকলিস্ট — ফাতেমা বেগম</Text>
                      <Text style={styles.checklistSubtitle}>উচ্চ রক্তচাপ স্ক্রিনিং</Text>
                    </View>
                    <Icon name="assignment-turned-in" color="#70605A" size={24} />
                  </View>

                  <View style={styles.checklistDivider} />

                  <View style={styles.checklistBody}>
                    {checklist.map((task) => (
                      <Pressable
                        key={task.id}
                        onPress={() => toggleChecklist(task.id)}
                        style={styles.checkRow}
                      >
                        <View style={[styles.checkBox, task.checked && styles.checkBoxActive]}>
                          {task.checked && <Icon name="check" color="#FFFFFF" size={16} />}
                        </View>
                        <Text style={[styles.checkLabel, task.checked && styles.checkLabelActive]}>
                          {task.text}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Text style={styles.timeText}>{item.timestamp}</Text>
              </View>
            );
          }

          if (item.type === "referral") {
            return (
              <View style={styles.messageWrap}>
                <View style={styles.referralCard}>
                  <View style={styles.referralLeft}>
                    <View style={styles.referralIconContainer}>
                      <Icon name="local-hospital" color="#FFFFFF" size={20} />
                    </View>
                    <View style={styles.referralInfo}>
                      <Text style={styles.referralTitle}>জরুরি রেফারেল সুপারিশ</Text>
                      <Text style={styles.referralDesc} numberOfLines={2}>
                        BP ১৫০/১০০ mmHg প্রি-eclampsia-র লক্ষণ হতে পারে। অনুগ্রহ করে রোগীকে উপজেলা স্বাস্থ্য কমপ্লেক্সে রেফার করুন।
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.timeText}>{item.timestamp}</Text>
              </View>
            );
          }

          const isUser = item.role === "user";
          return (
            <View style={[styles.messageWrap, isUser && styles.messageWrapUser]}>
              <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
                  {item.text}
                </Text>
              </View>
              <Text style={[styles.timeText, isUser && styles.userTimeText]}>
                {item.timestamp}
              </Text>
            </View>
          );
        }}
      />

      {/* Input Panel */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <View style={styles.inputPill}>
            <TextInput
              onChangeText={setInput}
              onSubmitEditing={submitInput}
              placeholder="বার্তা লিখুন..."
              placeholderTextColor="#A08E88"
              style={styles.input}
              value={input}
            />
            <Pressable style={styles.attachBtn}>
              <Icon name="attach-file" color="#A08E88" size={20} />
            </Pressable>
          </View>

          <Pressable onPress={submitInput} style={styles.recordBtn}>
            <Icon name="mic" color="#FFFFFF" size={22} />
          </Pressable>
        </View>

        <Text style={styles.securityLabel}>সুরক্ষিত এনক্রিপ্টেড ডাটা কানেকশন</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFF9F6", // Cream background
    flex: 1
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "#FFF9F6",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 52, android: 56, default: 12 }),
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE9"
  },
  topLeft: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 12
  },
  backButton: {
    padding: 4
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#70605A", // Clinician gray-brown circle
    alignItems: "center",
    justifyContent: "center"
  },
  headerInfo: {
    gap: 2
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E57A58"
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4A6047"
  },
  onlineText: {
    fontSize: 11,
    color: "#4A6047",
    fontWeight: "bold"
  },
  urgentButton: {
    backgroundColor: "#FCEBE5",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(179, 38, 30, 0.12)"
  },
  urgentText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B3261E"
  },
  modeStrip: {
    backgroundColor: "#E57A58", // Brand terracotta strip
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10
  },
  modeStripText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold"
  },
  messageList: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20
  },
  messageWrap: {
    alignItems: "flex-start",
    width: "100%"
  },
  messageWrapUser: {
    alignItems: "flex-end"
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "85%"
  },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    elevation: 1,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6
  },
  userBubble: {
    backgroundColor: "#70605A", // Dark warm brown matching design perfectly
    color: "#FFFFFF"
  },
  bubbleText: {
    fontSize: 15,
    color: "#4A3E39",
    lineHeight: 22
  },
  userBubbleText: {
    color: "#FFFFFF"
  },
  timeText: {
    fontSize: 11,
    color: "#A08E88",
    marginTop: 4,
    marginLeft: 6
  },
  userTimeText: {
    marginRight: 6,
    textAlign: "right",
    width: "100%"
  },

  // Premium Checklist Card styles
  checklistCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#70605A", // Brown border
    padding: 16,
    width: "90%",
    elevation: 2,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8
  },
  checklistHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  checklistHeaderLeft: {
    gap: 2
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#70605A"
  },
  checklistSubtitle: {
    fontSize: 12,
    color: "#A08E88"
  },
  checklistDivider: {
    height: 1,
    backgroundColor: "#F5ECE9",
    marginVertical: 12
  },
  checklistBody: {
    gap: 12
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF9F6",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F5ECE9"
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#70605A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  checkBoxActive: {
    backgroundColor: "#70605A"
  },
  checkLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#70605A"
  },
  checkLabelActive: {
    color: "#4A3E39"
  },

  // Premium Referral Card styles
  referralCard: {
    backgroundColor: "#FCEBE5", // Soft red-pink background
    borderRadius: 16,
    padding: 16,
    width: "90%",
    borderWidth: 1,
    borderColor: "rgba(179, 38, 30, 0.08)"
  },
  referralLeft: {
    flexDirection: "row",
    gap: 12
  },
  referralIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#B3261E", // Crimson red circle
    alignItems: "center",
    justifyContent: "center"
  },
  referralInfo: {
    flex: 1,
    gap: 4
  },
  referralTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#B3261E"
  },
  referralDesc: {
    fontSize: 12,
    color: "#70605A",
    lineHeight: 16
  },

  // Chat Input Container
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F5ECE9",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    gap: 8
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  inputPill: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F2EBE8", // Soft light gray-brown
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between"
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#4A3E39",
    paddingVertical: 8
  },
  attachBtn: {
    padding: 4
  },
  recordBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#70605A", // Dark warm record button matching design perfectly
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  securityLabel: {
    fontSize: 11,
    color: "#A08E88",
    textAlign: "center",
    marginTop: 2
  }
});
