import { useEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { MotherDashboard } from "@/features/mother/MotherDashboard";
import { getCurrentMotherProfile } from "@/auth/roleSession";
import { colors, radius, spacing, typography } from "@/theme";
import { copy } from "@/data/stitchCopy.bn";
import { scheduleReminder } from "@/notifications/notify";

export default function MotherHomeScreen() {
  const [week, setWeek] = useState(24);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentMotherProfile()
      .then((profile) => {
        if (profile?.gestationalAgeWeeks) {
          setWeek(profile.gestationalAgeWeeks);
        }
        // Schedule visit reminder (if visit scheduled, e.g. at 08:00)
        scheduleReminder("📅 পরিদর্শন আজ", "আজ আপনার স্বাস্থ্যকর্মী আসবেন", 8, 0, false, "maasheba-reminders");
      })
      .catch((loadError) => {
        setLoadError(loadError instanceof Error ? loadError.message : copy.common.loadFailed);
      });
  }, []);

  return (
    <View style={styles.screen}>
      {loadError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{copy.common.loadFailed}</Text>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}
      <MotherDashboard week={week} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
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
  }
});
