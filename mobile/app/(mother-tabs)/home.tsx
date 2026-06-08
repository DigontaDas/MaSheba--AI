import { useEffect, useState } from "react";
import { Text, View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { MotherDashboard } from "@/features/mother/MotherDashboard";
import { getCurrentMotherProfile, type MotherProfile } from "@/auth/roleSession";
import { colors, radius, spacing, typography } from "@/theme";
import { copy } from "@/data/stitchCopy.bn";
import { scheduleReminder } from "@/notifications/notify";
import { useLanguage } from "@/context/LanguageContext";
import { getPregnancyWeeks } from "@/utils/pregnancy";
import { Icon } from "@/components/ui/Icon";
import { toBanglaNumber } from "@/utils/banglaNumerals";

export default function MotherHomeScreen() {
  const { language: lang } = useLanguage();
  const [profile, setProfile] = useState<MotherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function checkMotherStatus() {
      try {
        const p = await getCurrentMotherProfile();
        setProfile(p);
        
        if (!p || !p.lmpDate) {
          // No profile configured yet, redirect to setup
          router.replace("/mother-setup");
          return;
        }

        if (p.verificationStatus === "VERIFIED") {
          const todayStr = new Date().toISOString().split("T")[0];
          const lastScheduledDate = await AsyncStorage.getItem("maasheba.last_scheduled_visit_reminder_date");
          if (lastScheduledDate !== todayStr) {
            // Schedule visit reminder
            await scheduleReminder("📅 পরিদর্শন আজ", "আজ আপনার স্বাস্থ্যকর্মী আসবেন", 8, 0, false, "maasheba-reminders");
            await AsyncStorage.setItem("maasheba.last_scheduled_visit_reminder_date", todayStr);
          }
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : copy.common.loadFailed);
      } finally {
        setLoading(false);
      }
    }

    checkMotherStatus().catch(() => undefined);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.screen}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{copy.common.loadFailed}</Text>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return null;
  }


  // Enforce Dynamic Weeks calculation for verified mother
  const currentWeek = getPregnancyWeeks(profile.lmpDate, profile.gestationalAgeWeeks);

  return (
    <View style={styles.screen}>
      <MotherDashboard week={currentWeek} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.base
  },
  errorCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.xs,
    marginHorizontal: spacing.marginMobile,
    marginTop: spacing.base,
    padding: spacing.base
  },
  errorTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  errorText: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  statusCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.cardPadding,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: spacing.base
  },
  iconContainer: {
    backgroundColor: colors.surfaceContainer,
    width: 80,
    height: 80,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center"
  },
  statusTitle: {
    ...typography.h1,
    color: colors.primary
  },
  statusSubtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  detailsBox: {
    backgroundColor: colors.background,
    width: "100%",
    borderRadius: radius.default,
    padding: spacing.base,
    gap: spacing.sm
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  detailLabel: {
    ...typography.label,
    color: colors.outline,
    fontWeight: "bold"
  },
  detailValue: {
    ...typography.body,
    color: colors.onSurface
  },
  rejectionReasonBox: {
    backgroundColor: colors.errorContainer + "15",
    borderColor: colors.error + "40",
    borderWidth: 1,
    borderRadius: radius.default,
    padding: spacing.base,
    width: "100%",
    gap: spacing.xs,
    marginTop: spacing.xs
  },
  rejectionReasonLabel: {
    ...typography.label,
    color: colors.error,
    fontWeight: "bold"
  },
  rejectionReasonText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    fontSize: 14
  },
  hwNotice: {
    ...typography.caption,
    color: colors.outline,
    textAlign: "center"
  },
  reSubmitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    marginTop: spacing.sm
  },
  reSubmitText: {
    ...typography.body,
    color: colors.onPrimary,
    fontWeight: "bold"
  },
  pressed: {
    opacity: 0.8
  }
});
