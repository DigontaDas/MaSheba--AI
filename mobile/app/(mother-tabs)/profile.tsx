import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { clearSession } from "@/auth/secureSession";
import { clearRoleSession, getCurrentMotherProfile, type MotherProfile } from "@/auth/roleSession";
import { supabase } from "@/auth/supabaseAuth";
import { copy } from "@/data/stitchCopy.bn";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<MotherProfile | null>(null);

  useEffect(() => {
    getCurrentMotherProfile().then(setProfile).catch(() => undefined);
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      await Promise.all([clearSession(), clearRoleSession()]);
      router.replace("/(auth)/login");
    }
  };

  const displayName = profile?.name ?? copy.profile.name;
  const week = profile?.gestationalAgeWeeks ?? 28;

  return (
    <ScreenShell>
      <View style={styles.topBar}>
        <Icon name="arrow-back" />
        <Text style={styles.title}>{copy.profile.title}</Text>
        <Icon name="settings" />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.slice(0, 1)}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <View style={styles.verified}>
          <Icon name="verified" color={colors.secondary} size={16} />
          <Text style={styles.verifiedText}>{copy.profile.verifiedMother}</Text>
        </View>
      </View>

      <InfoSection
        icon="person"
        title={copy.profile.personalInfo}
        rows={[
          [copy.profile.nameLabel, displayName],
          [copy.profile.age, copy.profile.ageValue],
          [copy.profile.location, copy.profile.locationValue]
        ]}
      />
      <InfoSection
        icon="favorite"
        title={copy.profile.pregnancyDetails}
        rows={[
          [copy.profile.edd, copy.profile.eddValue],
          [copy.profile.currentWeek, `${toBanglaNumber(week)} সপ্তাহ`],
          [copy.profile.bloodGroup, copy.profile.bloodGroupValue]
        ]}
      />

      <View style={styles.settings}>
        <SettingsRow icon="translate" label={copy.profile.language} value={copy.profile.bangla} />
        <SettingsRow icon="notifications" label={copy.profile.notifications} />
        <SettingsRow icon="security" label={copy.profile.security} />
        <SettingsRow icon="help" label={copy.profile.help} />
        <Pressable accessibilityLabel={copy.profile.logout} accessibilityRole="button" style={styles.logout} onPress={logout}>
          <Icon name="logout" color={colors.error} />
          <Text style={styles.logoutText}>{copy.profile.logout}</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

function InfoSection({
  icon,
  title,
  rows
}: {
  icon: "person" | "favorite";
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name={icon} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.infoRow}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value
}: {
  icon: "translate" | "notifications" | "security" | "help";
  label: string;
  value?: string;
}) {
  return (
    <View style={styles.settingsRow}>
      <Icon name={icon} color={colors.primary} />
      <Text style={styles.settingsLabel}>{label}</Text>
      {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
      <Icon name="chevron-right" color={colors.outline} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  title: {
    ...typography.h2,
    color: colors.onSurface,
    flex: 1,
    textAlign: "center"
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.cardPadding
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.full,
    height: 92,
    justifyContent: "center",
    width: 92
  },
  avatarText: {
    ...typography.h1,
    color: colors.primary
  },
  name: {
    ...typography.h2,
    color: colors.onSurface
  },
  verified: {
    alignItems: "center",
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  verifiedText: {
    ...typography.caption,
    color: colors.onSecondaryFixed
  },
  section: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.base,
    padding: spacing.cardPadding
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  sectionTitle: {
    ...typography.body,
    color: colors.onSurface,
    flex: 1,
    fontFamily: typography.h2.fontFamily
  },
  infoRow: {
    flexDirection: "row",
    gap: spacing.base,
    justifyContent: "space-between"
  },
  infoLabel: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  infoValue: {
    ...typography.label,
    color: colors.onSurface,
    flex: 1,
    textAlign: "right"
  },
  settings: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: "hidden"
  },
  settingsRow: {
    alignItems: "center",
    borderBottomColor: colors.outlineVariant,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.base
  },
  settingsLabel: {
    ...typography.body,
    color: colors.onSurface,
    flex: 1
  },
  settingsValue: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  logout: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.base
  },
  logoutText: {
    ...typography.body,
    color: colors.error,
    fontFamily: typography.h2.fontFamily
  }
});
