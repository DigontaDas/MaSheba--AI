import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { clearRoleSession } from "@/auth/roleSession";
import { getSession, clearSession } from "@/auth/secureSession";
import { supabase } from "@/auth/supabaseAuth";
import { copy } from "@/data/stitchCopy.bn";
import { getLocalDbErrorMessage } from "@/db/localDbAccess";
import { getPatients } from "@/db/patients";
import { getVisitCountForChwSince } from "@/db/visits";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import { getInitials } from "./helpers";

type ChwProfileRow = {
  id: string;
  name: string | null;
};

export default function ChwProfileScreen() {
  const [name, setName] = useState<string>(copy.chwProfile.fallbackName);
  const [patientCount, setPatientCount] = useState(0);
  const [visitCount, setVisitCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const session = await getSession();
    if (!session) {
      throw new Error(copy.assessment.sessionRequired);
    }

    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const [patients, visitsThisWeek, profileResponse] = await Promise.all([
      getPatients(),
      getVisitCountForChwSince(session.chwId, startOfWeek.toISOString()),
      supabase.from("chws").select("id,name").eq("id", session.chwId).maybeSingle<ChwProfileRow>()
    ]);

    setPatientCount(patients.length);
    setVisitCount(visitsThisWeek);
    if (!profileResponse.error && profileResponse.data?.name) {
      setName(profileResponse.data.name);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        setLoadError(getLocalDbErrorMessage(error, copy.common.loadFailed));
      });
    }, [load])
  );

  const showInfo = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: copy.common.close }]);
  };

  const confirmLogout = () => {
    Alert.alert(copy.common.logout, copy.chwProfile.logoutPrompt, [
      { text: copy.common.close, style: "cancel" },
      {
        text: copy.common.logout,
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.auth.signOut();
          } finally {
            await Promise.all([clearSession(), clearRoleSession()]);
            router.replace("/(auth)/login");
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Text style={styles.title}>{copy.chwProfile.title}</Text>
          <Pressable accessibilityLabel={copy.chwProfile.edit} style={styles.topIconButton}>
            <Icon color={colors.primary} name="edit" />
          </Pressable>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(name)}</Text>
            </View>
            <View style={styles.cameraBadge}>
              <Icon color={colors.onPrimary} name="photo-camera" size={14} />
            </View>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>{copy.chwProfile.roleLabel}</Text>
          <View style={styles.areaBadge}>
            <Text style={styles.areaBadgeText}>{copy.chwProfile.areaLabel}</Text>
          </View>
          {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryStatCard]}>
            <Text style={[styles.statValue, styles.primaryStatValue]}>{toBanglaNumber(visitCount)}</Text>
            <Text style={styles.statLabel}>{copy.chwProfile.visitsThisWeek}</Text>
          </View>
          <View style={[styles.statCard, styles.secondaryStatCard]}>
            <Text style={[styles.statValue, styles.secondaryStatValue]}>{toBanglaNumber(patientCount)}</Text>
            <Text style={styles.statLabel}>{copy.chwProfile.patientsCount}</Text>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{copy.chwProfile.settingsTitle}</Text>
          <Pressable
            accessibilityLabel={copy.chwProfile.language}
            onPress={() => showInfo(copy.chwProfile.language, copy.chwProfile.languageMessage)}
            style={styles.settingRow}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIconWrap}>
                <Icon color={colors.onSurfaceVariant} name="language" />
              </View>
              <Text style={styles.settingText}>{copy.chwProfile.language}</Text>
            </View>
            <Icon color={colors.outline} name="chevron-right" />
          </Pressable>
          <Pressable
            accessibilityLabel={copy.chwProfile.guide}
            onPress={() => showInfo(copy.chwProfile.guide, copy.chwProfile.guideMessage)}
            style={styles.settingRow}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIconWrap}>
                <Icon color={colors.onSurfaceVariant} name="menu-book" />
              </View>
              <Text style={styles.settingText}>{copy.chwProfile.guide}</Text>
            </View>
            <Icon color={colors.outline} name="chevron-right" />
          </Pressable>
          <Pressable
            accessibilityLabel={copy.chwProfile.support}
            onPress={() => showInfo(copy.chwProfile.support, copy.chwProfile.supportMessage)}
            style={[styles.settingRow, styles.settingRowLast]}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIconWrap}>
                <Icon color={colors.onSurfaceVariant} name="medical-services" />
              </View>
              <Text style={styles.settingText}>{copy.chwProfile.support}</Text>
            </View>
            <Icon color={colors.outline} name="chevron-right" />
          </Pressable>
        </View>

        <Pressable accessibilityLabel={copy.common.logout} onPress={confirmLogout} style={styles.logoutCard}>
          <View style={styles.settingLeft}>
            <View style={styles.logoutIconWrap}>
              <Icon color={colors.error} name="logout" />
            </View>
            <Text style={styles.logoutText}>{copy.common.logout}</Text>
          </View>
          <Icon color={colors.error} name="chevron-right" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    gap: spacing.base,
    paddingBottom: spacing.xl,
    paddingHorizontal: 20,
    paddingTop: spacing.base
  },
  topBar: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.card,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 80,
    paddingHorizontal: spacing.base
  },
  title: {
    ...typography.h2,
    color: colors.primary
  },
  topIconButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  avatarSection: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg
  },
  avatarWrap: {
    marginBottom: spacing.sm,
    position: "relative"
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  avatarText: {
    ...typography.h2,
    color: colors.onPrimary
  },
  cameraBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    borderWidth: 2,
    bottom: -2,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: -2,
    width: 24
  },
  name: {
    ...typography.h1,
    color: colors.onSurface,
    textAlign: "center"
  },
  role: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    fontFamily: typography.label.fontFamily
  },
  areaBadge: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs
  },
  areaBadgeText: {
    ...typography.caption,
    color: colors.onSecondaryContainer,
    fontFamily: typography.label.fontFamily
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.base
  },
  statCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderLeftWidth: 4,
    borderRadius: radius.card,
    flex: 1,
    minHeight: 132,
    padding: spacing.cardPadding,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2
  },
  primaryStatCard: {
    borderLeftColor: colors.primary
  },
  secondaryStatCard: {
    borderLeftColor: colors.secondary
  },
  statValue: {
    ...typography.h1,
    marginBottom: spacing.xs
  },
  primaryStatValue: {
    color: colors.primary
  },
  secondaryStatValue: {
    color: colors.secondary
  },
  statLabel: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  settingsCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.card,
    overflow: "hidden",
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2
  },
  settingsTitle: {
    ...typography.h2,
    color: colors.onSurface,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.cardPadding
  },
  settingRow: {
    alignItems: "center",
    borderBottomColor: "rgba(218, 193, 186, 0.2)",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: spacing.base
  },
  settingRowLast: {
    borderBottomWidth: 0
  },
  settingLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.base
  },
  settingIconWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  settingText: {
    ...typography.body,
    color: colors.onSurface
  },
  logoutCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
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
  logoutIconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(255, 218, 214, 0.4)",
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  logoutText: {
    ...typography.body,
    color: colors.error,
    fontFamily: typography.h2.fontFamily
  }
});
