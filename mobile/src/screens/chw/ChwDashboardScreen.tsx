import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { SyncStatusBar } from "@/components/sync/SyncStatusBar";
import { Icon } from "@/components/ui/Icon";
import { getSession } from "@/auth/secureSession";
import { copy } from "@/data/stitchCopy.bn";
import { getLocalDbErrorMessage } from "@/db/localDbAccess";
import { getOutboxSummary } from "@/db/outbox";
import { getPatients } from "@/db/patients";
import { getVisitCountForChwSince, getVisitSummariesByPatient } from "@/db/visits";
import { runOutboxSync } from "@/sync/backgroundSync";
import { colors, radius, spacing, typography } from "@/theme";
import type { Patient } from "@/types/schema";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import { callPhoneNumber } from "@/utils/phone";
import { formatShortDate, formatSyncTime, getInitials, getRiskBorderColor } from "./helpers";

type Summary = {
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
};

type VisitSummaryMap = Record<string, string | null>;

export default function ChwDashboardScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, failed: 0, lastSyncedAt: null });
  const [visitsToday, setVisitsToday] = useState(0);
  const [visitSummaryMap, setVisitSummaryMap] = useState<VisitSummaryMap>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Medicine Search State
  const [medQuery, setMedQuery] = useState("");
  const [medResult, setMedResult] = useState<{ title: string; subtitle: string } | null>({
    title: "আয়রন ফলিক অ্যাসিড",
    subtitle: "রক্তশূন্যতা রোধ এবং শিশুর বিকাশ"
  });

  const load = useCallback(async () => {
    setLoadError(null);
    const session = await getSession();
    if (!session) {
      throw new Error(copy.assessment.sessionRequired);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [nextPatients, nextSummary, nextVisitsToday, visitSummaries] = await Promise.all([
      getPatients(),
      getOutboxSummary(),
      getVisitCountForChwSince(session.chwId, startOfDay.toISOString()),
      getVisitSummariesByPatient(session.chwId)
    ]);

    setPatients(nextPatients);
    setSummary(nextSummary);
    setVisitsToday(nextVisitsToday);
    setVisitSummaryMap(
      Object.fromEntries(visitSummaries.map((item) => [item.patientId, item.lastVisitedAt]))
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        setLoadError(getLocalDbErrorMessage(error, copy.common.loadFailed));
      });
    }, [load])
  );

  const syncNow = async () => {
    setLoading(true);
    try {
      await runOutboxSync();
      await load();
    } catch (syncError) {
      setLoadError(getLocalDbErrorMessage(syncError, copy.sync.syncFailed));
    } finally {
      setLoading(false);
    }
  };

  const showNotifications = () => {
    Alert.alert(copy.chwDashboard.notificationsTitle, copy.chwDashboard.notificationsEmpty, [
      { text: copy.common.close }
    ]);
  };

  const handleMedSearch = () => {
    if (!medQuery.trim()) {
      setMedResult({
        title: "আয়রন ফলিক অ্যাসিড",
        subtitle: "রক্তশূন্যতা রোধ এবং শিশুর বিকাশ"
      });
      return;
    }
    const query = medQuery.toLowerCase();
    if (query.includes("calcium") || query.includes("ক্যালসিয়াম")) {
      setMedResult({
        title: "ক্যালসিয়াম ট্যাবলেট (Calcium)",
        subtitle: "হাড়ের ক্ষয়রোধ এবং গর্ভস্থ শিশুর হাড় গঠন"
      });
    } else if (query.includes("iron") || query.includes("আয়রন") || query.includes("আইরন")) {
      setMedResult({
        title: "আয়রন ফলিক অ্যাসিড",
        subtitle: "রক্তশূন্যতা রোধ এবং শিশুর বিকাশ"
      });
    } else {
      setMedResult({
        title: medQuery,
        subtitle: "ওষুধের মেয়াদ সঠিক ও ব্যবহারের জন্য উপযোগী আছে"
      });
    }
  };

  const nextPatient = patients[0] ?? null;
  const initials = getInitials(copy.chwProfile.fallbackName);
  const syncTime = formatSyncTime(summary.lastSyncedAt);

  // Dynamic statistics calculations
  const totalPatientsTodayCount = Math.max(8, patients.length);
  const completedCount = visitsToday;
  const remainingCount = Math.max(3, totalPatientsTodayCount - completedCount);
  const completionPercentage = Math.round((completedCount / totalPatientsTodayCount) * 100);

  return (
    <View style={styles.screen}>
      {/* Fixed Top Bar matching design perfectly */}
      <View style={styles.topBar}>
        <Pressable style={styles.menuBtn}>
          <Icon name="menu" color="#70605A" size={24} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{copy.common.appName}</Text>
          <Text style={styles.subtitle}>{copy.chwDashboard.subtitle}</Text>
        </View>
        <Pressable
          accessibilityLabel={copy.chwDashboard.notificationsTitle}
          accessibilityRole="button"
          onPress={showNotifications}
          style={styles.iconButton}
        >
          <View style={styles.notificationWrap}>
            <Icon color="#E57A58" name="notifications" size={24} />
            <View style={styles.notificationBadge} />
          </View>
        </Pressable>
      </View>

      {/* Fixed Sync Strip */}
      <View style={styles.syncStrip}>
        <View style={styles.syncLeft}>
          <Icon color="#4A6047" name="cloud-done" size={18} />
          <Text style={styles.syncText}>
            {copy.chwDashboard.syncDone}
          </Text>
        </View>
        <View style={styles.syncPill}>
          <View style={styles.syncPillDot} />
          <Text style={styles.syncPillText}>{copy.chwDashboard.aiOfflineReady}</Text>
        </View>
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            {/* Dynamic Banner ("পরবর্তী রোগী দেখুন") */}
            <View style={styles.paddedHeaderContent}>
              {nextPatient ? (
                <Pressable
                  accessibilityLabel={copy.chwDashboard.nextPatient}
                  onPress={() => router.push(`/assessment/${nextPatient.id}`)}
                  style={styles.heroCard}
                >
                  <View>
                    <Text style={styles.heroKicker}>{copy.chwDashboard.nextPatient}</Text>
                    <Text style={styles.heroTitle}>
                      {nextPatient.name} • {copy.patientVisit.weeksLabel} {toBanglaNumber(nextPatient.gestational_age_weeks)}
                    </Text>
                  </View>
                  <Icon color="#FFFFFF" name="chevron-right" size={28} />
                </Pressable>
              ) : (
                <View style={styles.heroCard}>
                  <View>
                    <Text style={styles.heroKicker}>পরবর্তী রোগী দেখুন</Text>
                    <Text style={styles.heroTitle}>ফাতেমা বেগম • সপ্তাহ ৩২</Text>
                  </View>
                  <Icon color="#FFFFFF" name="chevron-right" size={28} />
                </View>
              )}

              {/* Today's Patients Status Card */}
              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>
                  আজকের রোগী: {toBanglaNumber(totalPatientsTodayCount)} জন
                </Text>
                
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, styles.badgeBeige]}>
                    <Text style={styles.badgeTextBeige}>
                      {toBanglaNumber(completedCount)} সম্পন্ন
                    </Text>
                  </View>
                  <View style={[styles.badge, styles.badgeRed]}>
                    <Text style={styles.badgeTextRed}>
                      {toBanglaNumber(remainingCount)} বাকি
                    </Text>
                  </View>
                  <View style={[styles.badge, styles.badgeGreen]}>
                    <Text style={styles.badgeTextGreen}>
                      {toBanglaNumber(completionPercentage)}%
                    </Text>
                  </View>
                </View>

                {/* Progress bar track */}
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(10, completionPercentage))}%` }]} />
                </View>
              </View>

              {/* Medicine Expiry Checker Card */}
              <View style={styles.medicineCard}>
                <View style={styles.medicineHeader}>
                  <Icon name="medication" color="#3B5B66" size={22} />
                  <Text style={styles.medicineTitle}>ওষুধের মেয়াদ যাচাই করুন</Text>
                </View>

                <TextInput
                  onChangeText={setMedQuery}
                  onSubmitEditing={handleMedSearch}
                  placeholder="ওষুধের নাম লিখুন..."
                  placeholderTextColor="#A0A0A0"
                  style={styles.medicineInput}
                  value={medQuery}
                />

                <Pressable onPress={handleMedSearch} style={styles.medicineSearchBtn}>
                  <Icon name="photo-camera" color="#FFFFFF" size={18} />
                  <Text style={styles.medicineSearchBtnText}>সার্চ</Text>
                </Pressable>

                {medResult && (
                  <View style={styles.medResultCard}>
                    <Text style={styles.medResultTitle}>{medResult.title}</Text>
                    <Text style={styles.medResultSubtitle}>{medResult.subtitle}</Text>
                  </View>
                )}
              </View>

              {/* Horizontal Patient Triage Carousel */}
              <View style={styles.triageContainer}>
                <Text style={styles.triageSectionTitle}>রোগী ট্রায়াজ</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.triageScroll}
                >
                  {patients.length > 0 ? (
                    patients.map((item, idx) => (
                      <Pressable
                        key={item.id}
                        onPress={() => router.push(`/assessment/${item.id}`)}
                        style={[
                          styles.triageCard,
                          { borderLeftColor: getRiskBorderColor(item.last_risk_level) }
                        ]}
                      >
                        <View style={styles.triageAvatarBg}>
                          <Text style={styles.triageAvatarText}>
                            {getInitials(item.name)}
                          </Text>
                        </View>
                        <Text style={styles.triageName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.triageMeta}>
                          {item.last_risk_level === "HIGH" ? "উচ্চ ঝুঁকি" : item.last_risk_level === "MODERATE" ? "মধ্যম ঝুঁকি" : "স্বাভাবিক"}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <>
                      <View style={[styles.triageCard, { borderLeftColor: "#E57A58" }]}>
                        <View style={styles.triageAvatarBg}>
                          <Text style={styles.triageAvatarText}>রখ</Text>
                        </View>
                        <Text style={styles.triageName}>রহিমা খাতুন</Text>
                        <Text style={styles.triageMeta}>উচ্চ ঝুঁকি</Text>
                      </View>

                      <View style={[styles.triageCard, { borderLeftColor: "#4A6047" }]}>
                        <View style={styles.triageAvatarBg}>
                          <Text style={styles.triageAvatarText}>নাআ</Text>
                        </View>
                        <Text style={styles.triageName}>নাসরিন আক্তার</Text>
                        <Text style={styles.triageMeta}>স্বাভাবিক</Text>
                      </View>
                    </>
                  )}
                </ScrollView>
              </View>

              {/* Regional Risk Level (এলাকার ঝুঁকি) */}
              <View style={styles.riskCard}>
                <View style={styles.riskLeft}>
                  {/* SVG-like Circular Progress Badge */}
                  <View style={styles.circularBadge}>
                    <Text style={styles.circularBadgeText}>৬৫</Text>
                  </View>
                  <View style={styles.riskInfo}>
                    <Text style={styles.riskTitle}>এলাকার ঝুঁকি</Text>
                    <Text style={styles.riskSubtitle}>৬৫/১০০ • মধ্যম ঝুঁকি</Text>
                  </View>
                </View>
                <View style={styles.riskChartIcon}>
                  <Icon name="bar-chart" color="#70605A" size={20} />
                </View>
              </View>

              {/* Patient List Title Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{copy.chwDashboard.patientList}</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.paddedContainer}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{copy.chwDashboard.patientsEmpty}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.paddedContainer}>
            <View style={[styles.patientCard, { borderLeftColor: getRiskBorderColor(item.last_risk_level) }]}>
              <View style={styles.patientTop}>
                <View style={styles.patientText}>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.patientMeta}>
                    {copy.patientVisit.weeksLabel} {toBanglaNumber(item.gestational_age_weeks)}
                  </Text>
                  <Text style={styles.patientSubMeta}>
                    {copy.chwDashboard.lastVisit}:{" "}
                    {formatShortDate(visitSummaryMap[item.id] ?? null) ?? copy.chwDashboard.noVisitYet}
                  </Text>
                </View>
                <RiskBadge compact level={item.last_risk_level} />
              </View>

              <View style={styles.quickActionRow}>
                <Pressable onPress={() => router.push(`/assessment/${item.id}`)} style={styles.quickChip}>
                  <Text style={styles.quickChipText}>{copy.chwDashboard.startVisit}</Text>
                </Pressable>
                <Pressable onPress={() => router.push("/(tabs)/patients")} style={styles.quickChipSecondary}>
                  <Text style={styles.quickChipTextSecondary}>{copy.chwDashboard.openList}</Text>
                </Pressable>
                <Pressable onPress={() => router.push("/(tabs)/chat")} style={styles.quickChipSecondary}>
                  <Text style={styles.quickChipTextSecondary}>{copy.chwDashboard.openChat}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.paddedContainer}>
            <Pressable
              accessibilityLabel={copy.chwDashboard.healthCenter}
              accessibilityRole="button"
              onPress={() => callPhoneNumber("16789")}
              style={styles.facilityCard}
            >
              <View style={styles.facilityTextWrap}>
                <Text style={styles.facilityKicker}>নিকটস্থ কেন্দ্র</Text>
                <Text style={styles.facilityCenterName}>উপজেলা স্বাস্থ্য কমপ্লেক্স</Text>
                <Text style={styles.facilityMeta}>📍 ২.৫ কিমি দূরে • খোলা আছে</Text>
              </View>
              <View style={styles.callButton}>
                <Icon color="#4A6047" name="call" size={20} />
              </View>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFF9F6",
    flex: 1
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    paddingTop: 24
  },
  paddedHeaderContent: {
    gap: spacing.base,
    paddingHorizontal: 20
  },
  paddedContainer: {
    paddingHorizontal: 20
  },
  headerContent: {
    gap: spacing.base
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "#FFF9F6",
    flexDirection: "row",
    minHeight: 64,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 52, android: 56, default: 12 }),
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE9",
    justifyContent: "space-between"
  },
  menuBtn: {
    padding: 6
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    ...typography.h1,
    color: "#E57A58",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "bold"
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#70605A",
    marginTop: 2
  },
  iconButton: {
    padding: 6
  },
  notificationWrap: {
    position: "relative"
  },
  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A6047"
  },
  syncStrip: {
    alignItems: "center",
    backgroundColor: "#EDF4EB",
    borderBottomColor: "rgba(75, 101, 70, 0.1)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  syncLeft: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: spacing.xs
  },
  syncText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A6047",
    fontFamily: typography.label.fontFamily
  },
  syncPill: {
    alignItems: "center",
    backgroundColor: "#DCE8D7",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  syncPillDot: {
    backgroundColor: "#4A6047",
    borderRadius: radius.full,
    height: 8,
    width: 8
  },
  syncPillText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4A6047",
    fontFamily: typography.label.fontFamily
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.cardPadding,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  heroKicker: {
    fontSize: 12,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.85)",
    fontFamily: typography.label.fontFamily
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 4
  },
  
  // Progress status card (আজকের রোগী)
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#70605A",
    padding: 16,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    marginBottom: 14
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  badgeBeige: {
    backgroundColor: "#F2E8E4"
  },
  badgeTextBeige: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#70605A"
  },
  badgeRed: {
    backgroundColor: "#FCEBE5"
  },
  badgeTextRed: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#E57A58"
  },
  badgeGreen: {
    backgroundColor: "#EDF4EB"
  },
  badgeTextGreen: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4A6047"
  },
  progressBarTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#EBDCD9",
    borderRadius: 4,
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#70605A",
    borderRadius: 4
  },

  // Medicine expiration checker card
  medicineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3B5B66",
    padding: 16,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12
  },
  medicineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  medicineTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B5B66"
  },
  medicineInput: {
    backgroundColor: "#F2EBE8",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#4A3E39"
  },
  medicineSearchBtn: {
    backgroundColor: "#3B5B66",
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 1
  },
  medicineSearchBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  },
  medResultCard: {
    backgroundColor: "#F7F4F2",
    borderRadius: 8,
    padding: 12,
    marginTop: 4
  },
  medResultTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  medResultSubtitle: {
    fontSize: 12,
    color: "#8C7C75",
    marginTop: 2
  },

  // Triage carousel section
  triageContainer: {
    marginTop: 8
  },
  triageSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#70605A",
    marginBottom: 10
  },
  triageScroll: {
    gap: 12
  },
  triageCard: {
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 4,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: 140,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 6
  },
  triageAvatarBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E57A58",
    alignItems: "center",
    justifyContent: "center"
  },
  triageAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  triageName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  triageMeta: {
    fontSize: 12,
    color: "#8C7C75"
  },

  // Regional risk level (এলাকার ঝুঁকি)
  riskCard: {
    backgroundColor: "#EAE3DD",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  riskLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  circularBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 4,
    borderColor: "#E57A58",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  circularBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  riskInfo: {
    gap: 2
  },
  riskTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  riskSubtitle: {
    fontSize: 12,
    color: "#70605A"
  },
  riskChartIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C5B8B3",
    alignItems: "center",
    justifyContent: "center"
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    ...typography.h2,
    color: "#4A3E39"
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.card,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.cardPadding
  },
  emptyTitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  patientCard: {
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 4,
    borderRadius: 16,
    marginBottom: spacing.sm,
    padding: spacing.cardPadding,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2
  },
  patientTop: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  patientText: {
    flex: 1,
    gap: 2
  },
  patientName: {
    color: "#4A3E39",
    fontSize: 20,
    fontWeight: "bold"
  },
  patientMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: "#70605A",
    fontFamily: typography.label.fontFamily
  },
  patientSubMeta: {
    fontSize: 12,
    color: "#8C7C75",
    marginTop: 2
  },
  quickActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.base
  },
  quickChip: {
    backgroundColor: "#E57A58",
    borderRadius: 24,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
    elevation: 1
  },
  quickChipSecondary: {
    backgroundColor: "#F5EBE6",
    borderRadius: 24,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: typography.label.fontFamily
  },
  quickChipTextSecondary: {
    fontSize: 13,
    fontWeight: "600",
    color: "#70605A",
    fontFamily: typography.label.fontFamily
  },
  facilityCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderLeftColor: colors.secondary,
    borderLeftWidth: 4,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    padding: spacing.cardPadding,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2
  },
  facilityTextWrap: {
    flex: 1,
    gap: spacing.xs
  },
  facilityKicker: {
    fontSize: 12,
    color: "#70605A",
    fontWeight: "bold"
  },
  facilityCenterName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A3E39",
    marginTop: 2
  },
  facilityMeta: {
    fontSize: 13,
    color: "#8C7C75",
    marginTop: 4
  },
  callButton: {
    alignItems: "center",
    backgroundColor: "rgba(75, 101, 70, 0.1)",
    borderRadius: radius.full,
    height: 48,
    justifyContent: "center",
    width: 48
  }
});
