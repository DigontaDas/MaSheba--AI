import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PatientCard } from "@/components/patient/PatientCard";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { RiskGauge } from "@/components/risk/RiskGauge";
import { SyncStatusBar } from "@/components/sync/SyncStatusBar";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/data/stitchCopy.bn";
import { getOutboxSummary } from "@/db/outbox";
import { getPatients } from "@/db/patients";
import { runOutboxSync } from "@/sync/backgroundSync";
import { colors, radius, spacing, typography } from "@/theme";
import type { Patient, RiskLevel } from "@/types/schema";
import { toBanglaNumber } from "@/utils/banglaNumerals";

type Summary = {
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
};

export default function PatientDashboardScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, failed: 0, lastSyncedAt: null });
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const [nextPatients, nextSummary] = await Promise.all([getPatients(), getOutboxSummary()]);
      setPatients(nextPatients);
      setSummary(nextSummary);
    } catch (loadError) {
      setLoadError(loadError instanceof Error ? loadError.message : copy.common.loadFailed);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      await runOutboxSync();
      await load();
    } catch (syncError) {
      setLoadError(syncError instanceof Error ? syncError.message : copy.sync.syncFailed);
    } finally {
      setSyncing(false);
    }
  };

  const highRiskCount = patients.filter((patient) => patient.last_risk_level === "HIGH").length;
  const completed = Math.max(0, patients.length - summary.pending);
  const nextPatient = patients[0];
  const riskScore = patients.length ? Math.min(1, (highRiskCount * 0.45 + summary.pending * 0.08) / patients.length) : 0.2;

  return (
    <View style={styles.screen}>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <OfflineBanner pendingCount={summary.pending} />
            {loadError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>{copy.common.loadFailed}</Text>
                <Text style={styles.errorText}>{loadError}</Text>
                <PrimaryButton label={copy.common.retry} onPress={load} />
              </View>
            ) : null}
            <View style={styles.topBar}>
              <Pressable style={styles.iconButton}>
                <Icon name="menu" color={colors.onSurface} />
              </Pressable>
              <View style={styles.brand}>
                <Text style={styles.title}>{copy.common.appName}</Text>
                <Text style={styles.syncLabel}>{copy.common.synced}</Text>
              </View>
              <Pressable style={styles.iconButton}>
                <Icon name="notifications" color={colors.onSurface} />
              </Pressable>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                {copy.dashboard.todayPatients}: {toBanglaNumber(patients.length)} জন
              </Text>
              <ProgressBar value={completed} max={Math.max(1, patients.length)} label={`${toBanglaNumber(completed)}/${toBanglaNumber(Math.max(1, patients.length))} ${copy.dashboard.completed}`} />
              {nextPatient ? (
                <Pressable style={styles.nextRow} onPress={() => router.push(`/assessment/${nextPatient.id}`)}>
                  <Text style={styles.nextText}>{copy.dashboard.nextPatient}</Text>
                  <Icon name="arrow-forward" color={colors.primary} />
                </Pressable>
              ) : null}
            </View>

            <SyncStatusBar
              pending={summary.pending}
              synced={summary.lastSyncedAt ? 1 : 0}
              failed={summary.failed}
              loading={syncing}
              onSync={syncNow}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{copy.dashboard.triageTitle}</Text>
              <Text style={styles.sectionMeta}>{toBanglaNumber(highRiskCount)} {copy.dashboard.urgentRefer}</Text>
            </View>

            <View style={styles.triageRow}>
              {patients.slice(0, 3).map((patient) => (
                <TriageMiniCard
                  key={patient.id}
                  patient={patient}
                  level={patient.last_risk_level}
                  onPress={() => router.push(`/assessment/${patient.id}`)}
                />
              ))}
              {patients.length === 0 ? <Text style={styles.empty}>রোগীর তালিকা সিঙ্ক করুন।</Text> : null}
            </View>

            <View style={styles.riskCard}>
              <View style={styles.riskText}>
                <Text style={styles.liveData}>{copy.dashboard.liveData}</Text>
                <Text style={styles.sectionTitle}>{copy.dashboard.areaRisk}</Text>
                <Text style={styles.riskLevel}>{copy.dashboard.riskLevel}: {copy.dashboard.moderate}</Text>
              </View>
              <RiskGauge score={riskScore} level={riskScore > 0.65 ? "HIGH" : riskScore > 0.35 ? "MODERATE" : "LOW"} size={132} />
            </View>

            <View style={styles.clinicCard}>
              <Icon name="local-hospital" color={colors.secondary} />
              <View style={styles.clinicText}>
                <Text style={styles.clinicTitle}>{copy.dashboard.clinic}</Text>
                <Text style={styles.meta}>{copy.dashboard.distance}</Text>
              </View>
              <Icon name="call" color={colors.primary} />
            </View>

            <Text style={styles.sectionTitle}>রোগী</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>রোগীর তালিকা সিঙ্ক করুন।</Text>}
        renderItem={({ item }) => (
          <PatientCard
            patient={item}
            riskLevel={item.last_risk_level}
            nextAction={item.last_risk_level === "HIGH" ? copy.dashboard.urgentRefer : copy.dashboard.details}
            onPress={() => router.push(`/assessment/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

function TriageMiniCard({
  patient,
  level,
  onPress
}: {
  patient: Patient;
  level: RiskLevel;
  onPress: () => void;
}) {
  const label =
    level === "HIGH" ? copy.dashboard.urgentRefer : level === "MODERATE" ? copy.dashboard.attention : copy.dashboard.normal;
  return (
    <Pressable onPress={onPress} style={styles.triageCard}>
      <Text style={styles.triageStatus}>{label}</Text>
      <Text style={styles.triageName}>{patient.name}</Text>
      <Text style={styles.meta}>
        {copy.dashboard.pregnancy}: {toBanglaNumber(patient.gestational_age_weeks)} সপ্তাহ
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    gap: spacing.sm,
    padding: spacing.marginMobile,
    paddingBottom: spacing.xl
  },
  headerContent: {
    gap: spacing.base
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  brand: {
    flex: 1
  },
  title: {
    ...typography.h2,
    color: colors.onSurface
  },
  syncLabel: {
    ...typography.caption,
    color: colors.secondary
  },
  summaryCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.base,
    padding: spacing.cardPadding
  },
  summaryTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  nextRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  nextText: {
    ...typography.body,
    color: colors.primary,
    fontFamily: typography.h2.fontFamily
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  sectionMeta: {
    ...typography.caption,
    color: colors.error
  },
  triageRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  triageCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 120,
    padding: spacing.base
  },
  triageStatus: {
    ...typography.caption,
    color: colors.primary,
    fontFamily: typography.label.fontFamily
  },
  triageName: {
    ...typography.body,
    color: colors.onSurface,
    fontFamily: typography.h2.fontFamily
  },
  meta: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  riskCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.card,
    flexDirection: "row",
    gap: spacing.base,
    justifyContent: "space-between",
    padding: spacing.cardPadding
  },
  riskText: {
    flex: 1,
    gap: spacing.xs
  },
  liveData: {
    ...typography.caption,
    color: colors.secondary,
    fontFamily: typography.label.fontFamily
  },
  riskLevel: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  clinicCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.base
  },
  clinicText: {
    flex: 1
  },
  clinicTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontFamily: typography.h2.fontFamily
  },
  empty: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    padding: spacing.base,
    textAlign: "center"
  },
  errorCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.cardPadding
  },
  errorTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  errorText: {
    ...typography.body,
    color: colors.onSurfaceVariant
  }
});
