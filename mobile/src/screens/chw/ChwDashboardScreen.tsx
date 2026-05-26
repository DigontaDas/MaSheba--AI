import { useCallback, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { getSession } from "@/auth/secureSession";
import { getLocalDbErrorMessage } from "@/db/localDbAccess";
import { getOutboxSummary } from "@/db/outbox";
import { getPatients } from "@/db/patients";
import { getVisitCountForChwSince } from "@/db/visits";
import { getRecentUnreadMessages, type ChatMessage } from "@/api/chatService";
import { copy } from "@/data/stitchCopy.bn";
import { colors, radius, spacing, typography } from "@/theme";
import type { Patient } from "@/types/schema";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import { getInitials, getRiskBorderColor } from "./helpers";

type Summary = {
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
};

export default function ChwDashboardScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, failed: 0, lastSyncedAt: null });
  const [visitsToday, setVisitsToday] = useState(0);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const session = await getSession();
    if (!session) throw new Error("Session required");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [nextPatients, nextSummary, nextVisitsToday] = await Promise.all([
      getPatients(),
      getOutboxSummary(),
      getVisitCountForChwSince(session.chwId, startOfDay.toISOString())
    ]);

    setPatients(nextPatients);
    setSummary(nextSummary);
    setVisitsToday(nextVisitsToday);

    getRecentUnreadMessages(session.chwId, 3)
      .then(setRecentMessages)
      .catch(() => setRecentMessages([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => setLoadError(getLocalDbErrorMessage(error, "তথ্য লোড করা যায়নি")));
    }, [load])
  );

  const nextPatient = patients[0] ?? null;
  const totalPatients = Math.max(patients.length, 1);
  const pendingVisits = Math.max(0, patients.length - visitsToday);
  const completionPercent = Math.min(100, Math.round((visitsToday / totalPatients) * 100));
  const riskSortedPatients = useMemo(
    () =>
      [...patients].sort((a, b) => {
        const rank = { HIGH: 0, MODERATE: 1, LOW: 2 };
        return rank[a.last_risk_level] - rank[b.last_risk_level];
      }),
    [patients]
  );

  const showNotifications = () => {
    if (!recentMessages.length) {
      Alert.alert(copy.chwDashboard.notificationsTitle, copy.chwDashboard.notificationsEmpty, [{ text: copy.common.close }]);
      return;
    }
    Alert.alert(
      "নোটিফিকেশন",
      recentMessages.map((message) => `• ${message.message}`).join("\n"),
      [{ text: "চ্যাট খুলুন", onPress: () => router.push("/(tabs)/chat") }, { text: "বন্ধ" }]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerTitle}>মাশেবা AI</Text>
          <Text style={styles.headerSubtitle}>রাহেলা বেগম • স্বাস্থ্যকর্মী</Text>
        </View>
        <Pressable accessibilityLabel="নোটিফিকেশন" accessibilityRole="button" onPress={showNotifications} style={styles.iconButton}>
          <Icon name="notifications" color="#70605A" size={24} />
          {recentMessages.length ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{toBanglaNumber(recentMessages.length)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <Icon name="cloud-done" color="#4A6047" size={17} />
            <Text style={styles.statusText}>{summary.pending ? `${toBanglaNumber(summary.pending)} অপেক্ষমাণ` : "সিঙ্ক হয়েছে"}</Text>
          </View>
          <View style={styles.aiPill}>
            <View style={styles.aiDot} />
            <Text style={styles.aiText}>AI সক্রিয়</Text>
          </View>
        </View>

        {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => nextPatient && router.push(`/assessment/${nextPatient.id}`)}
          style={styles.nextCard}
        >
          <View style={styles.nextText}>
            <Text style={styles.nextKicker}>পরবর্তী রোগী</Text>
            <Text style={styles.nextName}>{nextPatient?.name ?? "আজকের রোগী নেই"}</Text>
            <Text style={styles.nextMeta}>
              {nextPatient ? `সপ্তাহ ${toBanglaNumber(nextPatient.gestational_age_weeks)}` : "রোগী ট্যাব থেকে তালিকা দেখুন"}
            </Text>
          </View>
          <View style={styles.visitButton}>
            <Text style={styles.visitButtonText}>ভিজিট শুরু</Text>
            <Icon name="chevron-right" color="#FFFFFF" size={20} />
          </View>
        </Pressable>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>আজকের অগ্রগতি</Text>
          <View style={styles.statsGrid}>
            <Stat label="মোট রোগী" value={patients.length} />
            <Stat label="সম্পন্ন" value={visitsToday} />
            <Stat label="বাকি" value={pendingVisits} />
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(6, completionPercent)}%` }]} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>রোগী ট্রায়াজ</Text>
          <Pressable onPress={() => router.push("/(tabs)/patients")}>
            <Text style={styles.linkText}>সব দেখুন</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.triageScroll}>
          {riskSortedPatients.map((patient) => (
            <Pressable
              key={patient.id}
              onPress={() => router.push(`/assessment/${patient.id}`)}
              style={[styles.triageCard, { borderTopColor: getRiskBorderColor(patient.last_risk_level) }]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(patient.name)}</Text>
              </View>
              <Text numberOfLines={1} style={styles.triageName}>{patient.name}</Text>
              <Text style={styles.triageWeek}>সপ্তাহ {toBanglaNumber(patient.gestational_age_weeks)}</Text>
              <Text style={[styles.riskText, { color: getRiskBorderColor(patient.last_risk_level) }]}>
                {patient.last_risk_level === "HIGH" ? "উচ্চ" : patient.last_risk_level === "MODERATE" ? "মধ্যম" : "নিম্ন"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.chatSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>সাম্প্রতিক চ্যাট</Text>
            <Pressable onPress={() => router.push("/(tabs)/chat")}>
              <Text style={styles.linkText}>সব দেখুন</Text>
            </Pressable>
          </View>
          {recentMessages.length ? (
            recentMessages.map((message) => (
              <Pressable key={message.id} onPress={() => router.push("/(tabs)/chat")} style={styles.messageRow}>
                <View style={styles.messageAvatar}>
                  <Icon name="chat-bubble" color="#E57A58" size={18} />
                </View>
                <View style={styles.messageTextWrap}>
                  <Text style={styles.messageTitle}>মায়ের বার্তা</Text>
                  <Text numberOfLines={1} style={styles.messagePreview}>{message.message}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>অপঠিত বার্তা নেই</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{toBanglaNumber(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
    color: "#E57A58",
    fontSize: 22,
    fontWeight: "bold"
  },
  headerSubtitle: {
    color: "#70605A",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#FCEBE5",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44
  },
  badge: {
    alignItems: "center",
    backgroundColor: "#B3261E",
    borderRadius: 9,
    minWidth: 18,
    paddingHorizontal: 4,
    position: "absolute",
    right: -2,
    top: -2
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold"
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 40
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  statusPill: {
    alignItems: "center",
    backgroundColor: "#EDF4EB",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  statusText: {
    color: "#4A6047",
    fontSize: 12,
    fontWeight: "bold"
  },
  aiPill: {
    alignItems: "center",
    backgroundColor: "#DCE8D7",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  aiDot: {
    backgroundColor: "#4A6047",
    borderRadius: 4,
    height: 8,
    width: 8
  },
  aiText: {
    color: "#4A6047",
    fontSize: 12,
    fontWeight: "bold"
  },
  errorText: {
    ...typography.caption,
    color: colors.error
  },
  nextCard: {
    backgroundColor: "#E57A58",
    borderRadius: 18,
    gap: 14,
    padding: 20
  },
  nextText: {
    gap: 4
  },
  nextKicker: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "bold"
  },
  nextName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold"
  },
  nextMeta: {
    color: "#FFF5F2",
    fontSize: 14,
    fontWeight: "600"
  },
  visitButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 22,
    flexDirection: "row",
    gap: 4,
    minHeight: 42,
    paddingHorizontal: 14
  },
  visitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  sectionTitle: {
    color: "#4A3E39",
    fontSize: 18,
    fontWeight: "bold"
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10
  },
  statItem: {
    backgroundColor: "#FFF9F6",
    borderRadius: 12,
    flex: 1,
    padding: 12
  },
  statValue: {
    color: "#E57A58",
    fontSize: 22,
    fontWeight: "bold"
  },
  statLabel: {
    color: "#70605A",
    fontSize: 12,
    fontWeight: "600"
  },
  progressTrack: {
    backgroundColor: "#EBDCD9",
    borderRadius: 4,
    height: 8,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: "#70605A",
    height: "100%"
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  linkText: {
    color: "#E57A58",
    fontSize: 13,
    fontWeight: "bold"
  },
  triageScroll: {
    gap: 12,
    paddingRight: 20
  },
  triageCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 16,
    borderTopWidth: 4,
    borderWidth: 1,
    gap: 6,
    padding: 14,
    width: 132
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },
  triageName: {
    color: "#4A3E39",
    fontSize: 14,
    fontWeight: "bold"
  },
  triageWeek: {
    color: "#70605A",
    fontSize: 12
  },
  riskText: {
    fontSize: 12,
    fontWeight: "bold"
  },
  chatSection: {
    gap: 10
  },
  messageRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12
  },
  messageAvatar: {
    alignItems: "center",
    backgroundColor: "#FCEBE5",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  messageTextWrap: {
    flex: 1
  },
  messageTitle: {
    color: "#4A3E39",
    fontSize: 13,
    fontWeight: "bold"
  },
  messagePreview: {
    color: "#70605A",
    fontSize: 12
  },
  emptyChat: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16
  },
  emptyChatText: {
    color: "#70605A",
    textAlign: "center"
  }
});
