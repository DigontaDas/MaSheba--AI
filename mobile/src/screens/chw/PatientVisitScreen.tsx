import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/data/stitchCopy.bn";
import { getLocalDbErrorMessage } from "@/db/localDbAccess";
import { getPatients } from "@/db/patients";
import { getVisitSummariesByPatient } from "@/db/visits";
import { getSession } from "@/auth/secureSession";
import { colors, radius, spacing, typography } from "@/theme";
import type { Patient } from "@/types/schema";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import { formatShortDate, getRiskBorderColor } from "./helpers";

type FilterKey = "ALL" | "EMERGENCY" | "HIGH" | "NORMAL";

const filterKeys: FilterKey[] = ["ALL", "EMERGENCY", "HIGH", "NORMAL"];

export default function PatientVisitScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visitSummaryMap, setVisitSummaryMap] = useState<Record<string, string | null>>({});
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const session = await getSession();
    if (!session) {
      throw new Error(copy.assessment.sessionRequired);
    }

    const [nextPatients, visitSummaries] = await Promise.all([
      getPatients(),
      getVisitSummariesByPatient(session.chwId)
    ]);

    setPatients(nextPatients);
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

  const filteredPatients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return patients.filter((patient) => {
      const matchesSearch =
        normalizedSearch.length === 0 || patient.name.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        activeFilter === "ALL"
          ? true
          : activeFilter === "EMERGENCY"
            ? patient.last_risk_level === "HIGH"
            : activeFilter === "HIGH"
              ? patient.last_risk_level === "MODERATE"
              : patient.last_risk_level === "LOW";

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, patients, search]);

  const filterLabel = (key: FilterKey) => {
    if (key === "ALL") return copy.patientVisit.filterAll;
    if (key === "EMERGENCY") return copy.patientVisit.filterEmergency;
    if (key === "HIGH") return copy.patientVisit.filterHighRisk;
    return copy.patientVisit.filterNormal;
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
      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.topBar}>
              <Pressable accessibilityLabel={copy.common.back} onPress={goBack} style={styles.iconButton}>
                <Icon color={colors.primary} name="arrow-back" />
              </Pressable>
              <Text style={styles.title}>{copy.patientVisit.title}</Text>
              <View style={styles.iconButton}>
                <Icon color={colors.primary} name="search" />
              </View>
            </View>

            <View style={styles.searchBar}>
              <Icon color={colors.outline} name="search" />
              <TextInput
                accessibilityLabel={copy.patientVisit.searchPlaceholder}
                onChangeText={setSearch}
                placeholder={copy.patientVisit.searchPlaceholder}
                placeholderTextColor={colors.outline}
                style={styles.searchInput}
                value={search}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {filterKeys.map((filterKey) => {
                const active = activeFilter === filterKey;
                return (
                  <Pressable
                    accessibilityLabel={filterLabel(filterKey)}
                    accessibilityRole="button"
                    accessibilityState={active ? { selected: true } : {}}
                    key={filterKey}
                    onPress={() => setActiveFilter(filterKey)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {filterLabel(filterKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {loadError ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>{copy.common.loadFailed}</Text>
                <Text style={styles.emptyBody}>{loadError}</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{copy.patientVisit.emptyTitle}</Text>
            <Text style={styles.emptyBody}>{copy.patientVisit.emptyBody}</Text>
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
                  {copy.patientVisit.lastVisit}:{" "}
                  {formatShortDate(visitSummaryMap[item.id] ?? null) ?? copy.patientVisit.noVisitYet}
                </Text>
              </View>
              <RiskBadge compact level={item.last_risk_level} />
            </View>

            <PrimaryButton
              label={copy.patientVisit.startVisit}
              onPress={() => router.push(`/assessment/${item.id}`)}
            />
          </View>
        )}
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
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 64
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
    flex: 1,
    fontSize: 24,
    lineHeight: 32
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.base
  },
  searchInput: {
    ...typography.body,
    color: colors.onSurface,
    flex: 1
  },
  filterRow: {
    gap: spacing.sm
  },
  filterChip: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.base
  },
  filterChipActive: {
    backgroundColor: colors.primaryContainer
  },
  filterChipText: {
    ...typography.label,
    color: colors.onSurfaceVariant,
    fontFamily: typography.label.fontFamily
  },
  filterChipTextActive: {
    color: colors.onPrimaryContainer
  },
  patientCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderLeftWidth: 4,
    borderRadius: radius.card,
    gap: spacing.base,
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
  emptyCard: {
    backgroundColor: "rgba(135, 167, 182, 0.12)",
    borderColor: colors.tertiaryContainer,
    borderRadius: radius.card,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: spacing.cardPadding
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.onSurface,
    marginBottom: spacing.xs,
    textAlign: "center"
  },
  emptyBody: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  }
});
