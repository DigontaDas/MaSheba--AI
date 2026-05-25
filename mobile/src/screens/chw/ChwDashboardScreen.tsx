import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
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

  const nextPatient = patients[0] ?? null;
  const initials = getInitials(copy.chwProfile.fallbackName);
  const syncTime = formatSyncTime(summary.lastSyncedAt);
  const statCards = useMemo(
    () => [
      { key: "patients", label: copy.chwDashboard.statActive, value: toBanglaNumber(patients.length) },
      { key: "visits", label: copy.chwDashboard.statCompleted, value: toBanglaNumber(visitsToday) },
      { key: "sync", label: copy.chwDashboard.statPending, value: toBanglaNumber(summary.pending) }
    ],
    [patients.length, summary.pending, visitsToday]
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.topBar}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.onlineDot} />
              </View>
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
                <Icon color={colors.primary} name="notifications" />
              </Pressable>
            </View>

            <View style={styles.syncStrip}>
              <View style={styles.syncLeft}>
                <Icon color={colors.secondary} name="cloud-done" size={18} />
                <Text style={styles.syncText}>
                  {copy.chwDashboard.syncDone}
                  {syncTime ? ` — ${syncTime}` : ""}
                </Text>
              </View>
              <View style={styles.syncPill}>
                <View style={styles.syncPillDot} />
                <Text style={styles.syncPillText}>{copy.chwDashboard.aiOfflineReady}</Text>
              </View>
            </View>

            <OfflineBanner pendingCount={summary.pending} />

            {loadError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>{copy.common.loadFailed}</Text>
                <Text style={styles.errorText}>{loadError}</Text>
              </View>
            ) : null}

            <SyncStatusBar
              pending={summary.pending}
              synced={summary.lastSyncedAt ? 1 : 0}
              failed={summary.failed}
              loading={loading}
              onSync={syncNow}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statRow}
            >
              {statCards.map((card) => (
                <View key={card.key} style={styles.statChip}>
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                </View>
              ))}
            </ScrollView>

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
                <Icon color={colors.onPrimaryContainer} name="chevron-right" size={28} />
              </Pressable>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{copy.chwDashboard.patientList}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{copy.chwDashboard.patientsEmpty}</Text>
          </View>
        }
        renderItem={({ item }) => (
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
        )}
        ListFooterComponent={
          <Pressable
            accessibilityLabel={copy.chwDashboard.healthCenter}
            accessibilityRole="button"
            onPress={() => callPhoneNumber("16789")}
            style={styles.facilityCard}
          >
            <View style={styles.facilityTextWrap}>
              <Text style={styles.facilityKicker}>{copy.chwDashboard.healthCenter}</Text>
              <Text style={styles.facilityMeta}>{copy.chwDashboard.centerDistance}</Text>
            </View>
            <View style={styles.callButton}>
              <Icon color={colors.secondary} name="call" />
            </View>
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: 20,
    paddingTop: spacing.base
  },
  headerContent: {
    gap: spacing.base
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "#FFF1E6",
    flexDirection: "row",
    minHeight: 64,
    paddingHorizontal: 20
  },
  avatarWrap: {
    height: 44,
    justifyContent: "center",
    marginRight: spacing.sm,
    width: 44
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  avatarText: {
    ...typography.label,
    color: colors.primary,
    fontFamily: typography.h2.fontFamily
  },
  onlineDot: {
    backgroundColor: colors.secondary,
    borderColor: "#FFF1E6",
    borderRadius: radius.full,
    borderWidth: 2,
    bottom: 1,
    height: 12,
    position: "absolute",
    right: 0,
    width: 12
  },
  titleWrap: {
    flex: 1
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 26,
    lineHeight: 34
  },
  subtitle: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    fontFamily: typography.label.fontFamily
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  syncStrip: {
    alignItems: "center",
    backgroundColor: "rgba(205, 235, 196, 0.4)",
    borderBottomColor: "rgba(75, 101, 70, 0.1)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  syncLeft: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: spacing.xs
  },
  syncText: {
    ...typography.caption,
    color: colors.onSecondaryFixedVariant,
    fontFamily: typography.label.fontFamily
  },
  syncPill: {
    alignItems: "center",
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  syncPillDot: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    height: 8,
    width: 8
  },
  syncPillText: {
    ...typography.caption,
    color: colors.onSecondaryFixedVariant,
    fontFamily: typography.label.fontFamily
  },
  errorCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.errorContainer,
    borderLeftColor: colors.error,
    borderLeftWidth: 4,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.cardPadding
  },
  errorTitle: {
    ...typography.h2,
    color: colors.onSurface,
    marginBottom: spacing.xs
  },
  errorText: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  statRow: {
    gap: spacing.sm
  },
  statChip: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    gap: 2,
    minWidth: 116,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm
  },
  statValue: {
    ...typography.h2,
    color: colors.onSecondaryContainer
  },
  statLabel: {
    ...typography.caption,
    color: colors.onSecondaryFixedVariant
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.card,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.cardPadding,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2
  },
  heroKicker: {
    ...typography.caption,
    color: colors.onPrimaryContainer,
    fontFamily: typography.label.fontFamily
  },
  heroTitle: {
    ...typography.h2,
    color: colors.onPrimaryContainer
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.onSurface
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
    backgroundColor: colors.surfaceContainerLowest,
    borderLeftWidth: 4,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
    padding: spacing.cardPadding,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
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
    ...typography.h2,
    color: colors.onSurface,
    fontSize: 20
  },
  patientMeta: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    fontFamily: typography.label.fontFamily
  },
  patientSubMeta: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  quickActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.base
  },
  quickChip: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.full,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.base
  },
  quickChipSecondary: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.base
  },
  quickChipText: {
    ...typography.label,
    color: colors.onPrimaryContainer,
    fontFamily: typography.label.fontFamily
  },
  quickChipTextSecondary: {
    ...typography.label,
    color: colors.onSurfaceVariant,
    fontFamily: typography.label.fontFamily
  },
  facilityCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderLeftColor: colors.secondary,
    borderLeftWidth: 4,
    borderRadius: radius.card,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    padding: spacing.cardPadding,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2
  },
  facilityTextWrap: {
    flex: 1,
    gap: spacing.xs
  },
  facilityKicker: {
    ...typography.h2,
    color: colors.onSurface
  },
  facilityMeta: {
    ...typography.caption,
    color: colors.onSurfaceVariant
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
