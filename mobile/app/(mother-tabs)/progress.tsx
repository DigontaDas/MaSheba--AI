import { useEffect, useState, useRef } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Icon } from "@/components/ui/Icon";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { getCurrentMotherProfile } from "@/auth/roleSession";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import { getWeeklySize, type WeeklySize } from "@/data/babySizeData";
import { colors, radius, spacing, typography } from "@/theme";

interface KickSession {
  id: string;
  date: string;
  time: string;
  count: number;
  duration: string;
}

export default function MotherProgressScreen() {
  const [gestationalWeek, setGestationalWeek] = useState(24);
  const [selectedExplorerWeek, setSelectedExplorerWeek] = useState(24);
  const [loading, setLoading] = useState(true);

  // Kick Counter States
  const [isTracking, setIsTracking] = useState(false);
  const [kicksCount, setKicksCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [kickHistory, setKickHistory] = useState<KickSession[]>([]);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Load Mother profile gestational week
    getCurrentMotherProfile()
      .then((profile) => {
        if (profile?.gestationalAgeWeeks) {
          setGestationalWeek(profile.gestationalAgeWeeks);
          setSelectedExplorerWeek(profile.gestationalAgeWeeks);
        }
      })
      .catch((err) => console.warn("Failed to load mother profile in progress:", err))
      .finally(() => setLoading(false));

    // Load Kick history from SecureStore
    SecureStore.getItemAsync("fetal_kick_history")
      .then((savedLog) => {
        if (savedLog) {
          setKickHistory(JSON.parse(savedLog));
        }
      })
      .catch((err) => console.warn("Failed to load kick history:", err));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer Effect
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTracking]);

  const startSession = () => {
    setIsTracking(true);
    setKicksCount(0);
    setElapsedSeconds(0);
  };

  const logKick = () => {
    const newCount = kicksCount + 1;
    setKicksCount(newCount);
    if (newCount === 10) {
      Alert.alert(
        "🎉 অভিনন্দন!",
        "১০টি নড়াচড়া সম্পূর্ণ হয়েছে! আপনার শিশুটি গর্ভে সুস্থ ও সক্রিয় রয়েছে।"
      );
    }
  };

  const cancelSession = () => {
    Alert.alert(
      "সেশন বাতিল করুন",
      "আপনি কি নিশ্চিত যে আপনি বর্তমান নড়াচড়া গণনার সেশনটি বাতিল করতে চান?",
      [
        { text: "না", style: "cancel" },
        {
          text: "হ্যাঁ",
          style: "destructive",
          onPress: () => {
            setIsTracking(false);
            setKicksCount(0);
            setElapsedSeconds(0);
          }
        }
      ]
    );
  };

  const formatDuration = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${toBanglaNumber(mins)} মিনিট ${toBanglaNumber(secs)} সেকেন্ড`;
  };

  const saveSession = async () => {
    if (kicksCount === 0) {
      Alert.alert("সংকেত", "সংরক্ষণ করার জন্য অন্তত ১টি নড়াচড়া নথিভুক্ত করুন।");
      return;
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString("bn-BD", { month: "short", day: "numeric" });
    const timeStr = today.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });

    const newSession: KickSession = {
      id: Date.now().toString(),
      date: dateStr,
      time: timeStr,
      count: kicksCount,
      duration: formatDuration(elapsedSeconds)
    };

    const updatedHistory = [newSession, ...kickHistory].slice(0, 10); // Keep last 10 logs
    setKickHistory(updatedHistory);

    try {
      await SecureStore.setItemAsync("fetal_kick_history", JSON.stringify(updatedHistory));
      Alert.alert("💾 সংরক্ষিত", "নড়াচড়া বিবরণী অফলাইনে সফলভাবে সংরক্ষণ করা হয়েছে।");
      setIsTracking(false);
      setKicksCount(0);
      setElapsedSeconds(0);
    } catch (err) {
      Alert.alert("ত্রুটি", "সংরক্ষণ করতে সমস্যা হয়েছে");
    }
  };

  const currentSize: WeeklySize = getWeeklySize(gestationalWeek);
  const explorerSize: WeeklySize = getWeeklySize(selectedExplorerWeek);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#E57A58" size="large" />
      </View>
    );
  }

  return (
    <ScreenShell>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="ফিরে যান" accessibilityRole="button" onPress={() => router.replace("/(mother-tabs)/home")} style={styles.backButton}>
          <Icon name="arrow-back" color="#70605A" size={24} />
        </Pressable>
        <Text style={styles.appName}>গর্ভকালীন অগ্রগতি</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Baby Size Visualizer Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>শিশুর বৃদ্ধির অগ্রগতি</Text>
          <Text style={styles.sectionSubtitle}>গর্ভকালীন প্রতি সপ্তাহে আপনার শিশুর আকার তুলনা করুন</Text>
        </View>

        <View style={styles.sizeHeroCard}>
          <View style={styles.sizeHeroMain}>
            <View style={styles.weekIndicator}>
              <Text style={styles.weekIndicatorText}>সপ্তাহ {toBanglaNumber(explorerSize.week)}</Text>
            </View>
            <Text style={styles.sizeTitle}>
              আপনার শিশু এখন একটি <Text style={styles.sizeFoodName}>{explorerSize.foodNameBn}</Text>-এর সমান!
            </Text>
            <Text style={styles.sizeSub}>
              ({explorerSize.foodNameEn})
            </Text>
          </View>

          <View style={styles.sizeStatsRow}>
            <View style={styles.sizeStat}>
              <Icon name="straighten" color="#E57A58" size={20} />
              <Text style={styles.sizeStatLabel}>গড় দৈর্ঘ্য</Text>
              <Text style={styles.sizeStatValue}>{explorerSize.lengthBn}</Text>
            </View>
            <View style={styles.sizeStatDivider} />
            <View style={styles.sizeStat}>
              <Icon name="scale" color="#E57A58" size={20} />
              <Text style={styles.sizeStatLabel}>গড় ওজন</Text>
              <Text style={styles.sizeStatValue}>{explorerSize.weightBn}</Text>
            </View>
          </View>

          <View style={styles.milestoneBlock}>
            <Text style={styles.milestoneTitle}>💡 এই সপ্তাহের শারীরিক পরিবর্তন:</Text>
            <Text style={styles.milestoneText}>{explorerSize.milestoneBn}</Text>
          </View>
        </View>

        {/* Horizontal Week Explorer */}
        <View style={styles.explorerSection}>
          <Text style={styles.explorerLabel}>অন্যান্য সপ্তাহ অনুসন্ধান করুন:</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={Array.from({ length: 40 }).map((_, i) => i + 1)}
            keyExtractor={(item) => item.toString()}
            contentContainerStyle={styles.weeksList}
            renderItem={({ item }) => {
              const isSelected = item === selectedExplorerWeek;
              const isCurrent = item === gestationalWeek;
              return (
                <Pressable
                  onPress={() => setSelectedExplorerWeek(item)}
                  style={[
                    styles.weekChip,
                    isSelected && styles.weekChipSelected,
                    isCurrent && !isSelected && styles.weekChipCurrent
                  ]}
                >
                  <Text
                    style={[
                      styles.weekChipText,
                      isSelected && styles.weekChipTextSelected,
                      isCurrent && !isSelected && styles.weekChipTextCurrent
                    ]}
                  >
                    সপ্তাহ {toBanglaNumber(item)}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* 2. Stateful Fetal Kick Counter Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fetal Kick Counter (নড়াচড়া ট্র্যাকার)</Text>
          <Text style={styles.sectionSubtitle}>শিশুর দৈনিক নড়াচড়া বা লাথি গণনা করুন (WHO নির্দেশিকা অনুযায়ী)</Text>
        </View>

        <View style={styles.kickCard}>
          {!isTracking ? (
            <View style={styles.kickIdleState}>
              <View style={styles.heartPulseWrapper}>
                <Icon name="favorite" color="#E57A58" size={48} />
              </View>
              <Text style={styles.kickInstruction}>
                দিনে ২ বার শিশুর নড়াচড়া পর্যবেক্ষণ করা ভালো। ২ ঘণ্টায় ১০টি নড়াচড়া সুস্থতার লক্ষণ।
              </Text>
              <Pressable onPress={startSession} style={styles.startSessionBtn}>
                <Icon name="play-arrow" color="#FFFFFF" size={20} />
                <Text style={styles.startSessionBtnText}>নড়াচড়া গণনা শুরু করুন</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.kickActiveState}>
              <View style={styles.timerRow}>
                <View style={styles.timerTag}>
                  <Icon name="timer" color="#E57A58" size={18} />
                  <Text style={styles.timerValue}>{formatDuration(elapsedSeconds)}</Text>
                </View>
                {kicksCount >= 10 && (
                  <View style={styles.completedBadge}>
                    <Icon name="check-circle" color="#4A6047" size={16} />
                    <Text style={styles.completedBadgeText}>১০টি সম্পূর্ণ</Text>
                  </View>
                )}
              </View>

              <Text style={styles.kicksCountLabel}>নড়াচড়ার সংখ্যা</Text>
              <Text style={styles.kicksCountValue}>{toBanglaNumber(kicksCount)}</Text>

              {/* Massive Tap Counter Button */}
              <Pressable onPress={logKick} style={styles.kickTapButton}>
                <Icon name="favorite" color="#FFFFFF" size={44} />
                <Text style={styles.kickTapBtnText}>নড়াচড়া নথিভুক্ত করুন</Text>
              </Pressable>

              <View style={styles.kickSessionActions}>
                <Pressable onPress={cancelSession} style={styles.cancelBtn}>
                  <Icon name="close" color="#B3261E" size={18} />
                  <Text style={styles.cancelBtnText}>বাতিল করুন</Text>
                </Pressable>

                <Pressable onPress={saveSession} style={styles.saveBtn}>
                  <Icon name="save" color="#FFFFFF" size={18} />
                  <Text style={styles.saveBtnText}>সেশন সেভ করুন</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Kick History Logs */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>📊 বিগত নড়াচড়ার বিবরণী লগ</Text>
          {kickHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>এখনো কোনো নড়াচড়া বিবরণী সংরক্ষিত নেই।</Text>
            </View>
          ) : (
            <View style={styles.historyCardList}>
              {kickHistory.map((item, idx) => (
                <View key={item.id} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <View style={styles.historyIconCircle}>
                      <Icon name="favorite" color="#E57A58" size={16} />
                    </View>
                    <View>
                      <Text style={styles.historyDate}>{item.date} • {item.time}</Text>
                      <Text style={styles.historyDuration}>সময়কাল: {item.duration}</Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyCountText}>{toBanglaNumber(item.count)} টি</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9F6"
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    backgroundColor: "#FFF9F6",
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE9"
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#FCEBE5"
  },
  appName: {
    ...typography.h2,
    color: "#70605A",
    fontWeight: "bold",
    fontSize: 18
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20
  },
  sectionHeader: {
    gap: 4,
    marginTop: 10
  },
  sectionTitle: {
    ...typography.h1,
    color: "#4A3E39",
    fontWeight: "bold",
    fontSize: 20
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#A08E88",
    fontWeight: "500"
  },

  // Baby Size Hero Styles
  sizeHeroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F5ECE9",
    elevation: 2,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    gap: 14
  },
  sizeHeroMain: {
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF2EF",
    paddingBottom: 14
  },
  weekIndicator: {
    backgroundColor: "#FCEBE5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  weekIndicatorText: {
    fontSize: 12,
    color: "#E57A58",
    fontWeight: "bold"
  },
  sizeTitle: {
    fontSize: 18,
    color: "#4A3E39",
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 26
  },
  sizeFoodName: {
    color: "#E57A58"
  },
  sizeSub: {
    fontSize: 12,
    color: "#A08E88",
    fontWeight: "600"
  },
  sizeStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  },
  sizeStat: {
    alignItems: "center",
    gap: 2
  },
  sizeStatLabel: {
    fontSize: 11,
    color: "#A08E88",
    fontWeight: "600"
  },
  sizeStatValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  sizeStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#F5ECE9"
  },
  milestoneBlock: {
    backgroundColor: "#FFF9F6",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFF2EF",
    gap: 6
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#70605A"
  },
  milestoneText: {
    fontSize: 13,
    color: "#70605A",
    lineHeight: 20
  },

  // Explorer Section
  explorerSection: {
    gap: 8
  },
  explorerLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#70605A",
    marginLeft: 2
  },
  weeksList: {
    gap: 8,
    paddingRight: 10
  },
  weekChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F5ECE9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  weekChipSelected: {
    backgroundColor: "#E57A58",
    borderColor: "#E57A58"
  },
  weekChipCurrent: {
    borderColor: "#E57A58",
    borderStyle: "dashed"
  },
  weekChipText: {
    fontSize: 12,
    color: "#70605A",
    fontWeight: "600"
  },
  weekChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  weekChipTextCurrent: {
    color: "#E57A58",
    fontWeight: "bold"
  },

  // Kick Counter Card
  kickCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F5ECE9",
    elevation: 2,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    padding: 16
  },
  kickIdleState: {
    alignItems: "center",
    paddingVertical: 10,
    gap: 16
  },
  heartPulseWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF2EF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4
  },
  kickInstruction: {
    fontSize: 13,
    color: "#70605A",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10
  },
  startSessionBtn: {
    backgroundColor: "#E57A58",
    borderRadius: 24,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  startSessionBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF"
  },

  kickActiveState: {
    alignItems: "center",
    gap: 12
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%"
  },
  timerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF2EF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  timerValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#E57A58"
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF5EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4A6047"
  },
  kicksCountLabel: {
    fontSize: 12,
    color: "#A08E88",
    fontWeight: "600",
    marginTop: 10
  },
  kicksCountValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#E57A58",
    lineHeight: 52
  },
  kickTapButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#E57A58",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    gap: 8,
    marginVertical: 14
  },
  kickTapBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  kickSessionActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
    marginTop: 10
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#FCEBE5",
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B3261E"
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#4A6047",
    borderRadius: 20,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF"
  },

  // History log styles
  historySection: {
    gap: 10,
    marginTop: 10
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  emptyHistory: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F5ECE9",
    alignItems: "center"
  },
  emptyHistoryText: {
    fontSize: 12,
    color: "#A08E88",
    fontWeight: "500"
  },
  historyCardList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5ECE9",
    padding: 12,
    gap: 12
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF9F6",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFF2EF"
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  historyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF2EF",
    alignItems: "center",
    justifyContent: "center"
  },
  historyDate: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  historyDuration: {
    fontSize: 11,
    color: "#A08E88",
    fontWeight: "600",
    marginTop: 2
  },
  historyRight: {
    backgroundColor: "#FCEBE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  historyCountText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#E57A58"
  }
});
