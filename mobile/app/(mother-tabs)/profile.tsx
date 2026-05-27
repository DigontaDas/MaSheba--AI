import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { clearSession } from "@/auth/secureSession";
import { clearRoleSession, getCurrentMotherProfile, type MotherProfile } from "@/auth/roleSession";
import { supabase } from "@/auth/supabaseAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useCopy } from "@/data/useCopy";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import { callPhoneNumber } from "@/utils/phone";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<MotherProfile | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const copy = useCopy();

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

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(mother-tabs)/home");
  };

  const toggleLanguage = () => {
    void setLanguage(language === "bn" ? "en" : "bn");
  };

  const showNotificationAlert = () => {
    Alert.alert(language === "en" ? "Notifications" : "নোটিফিকেশন", language === "en" ? "Notification setup is coming soon." : "নোটিফিকেশন সেটআপ শীঘ্রই আসছে।", [
      { text: language === "en" ? "OK" : "ঠিক আছে" }
    ]);
  };

  const requestPasswordReset = () => {
    Alert.alert(language === "en" ? "Change password" : "পাসওয়ার্ড পরিবর্তন", language === "en" ? "A password reset link will be sent to your email." : "পাসওয়ার্ড পরিবর্তনের জন্য আপনার ইমেইলে একটি লিঙ্ক পাঠানো হবে।", [
      { text: language === "en" ? "Cancel" : "বাতিল", style: "cancel" },
      {
        text: language === "en" ? "Send" : "পাঠান",
        onPress: async () => {
          try {
            const session = await supabase.auth.getSession();
            const email = session.data.session?.user?.email;
            if (!email) {
              Alert.alert(language === "en" ? "Problem" : "সমস্যা", language === "en" ? "Email was not found." : "ইমেইল পাওয়া যায়নি।", [{ text: language === "en" ? "OK" : "ঠিক আছে" }]);
              return;
            }
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) {
              Alert.alert(language === "en" ? "Problem" : "সমস্যা", language === "en" ? "Could not send email." : "ইমেইল পাঠানো যায়নি।", [{ text: language === "en" ? "OK" : "ঠিক আছে" }]);
              return;
            }
            Alert.alert(language === "en" ? "Success" : "সফল", language === "en" ? "Email has been sent." : "ইমেইল পাঠানো হয়েছে।", [{ text: language === "en" ? "OK" : "ঠিক আছে" }]);
          } catch {
            Alert.alert(language === "en" ? "Problem" : "সমস্যা", language === "en" ? "Could not send email." : "ইমেইল পাঠানো যায়নি।", [{ text: language === "en" ? "OK" : "ঠিক আছে" }]);
          }
        }
      }
    ]);
  };

  const showSupportAlert = () => {
    Alert.alert(language === "en" ? "Help and support" : "সাহায্য ও সাপোর্ট", language === "en" ? "Health hotline: 16767\nEmergency: 999" : "স্বাস্থ্য সেবা হটলাইন: ১৬৭৬৭\nজরুরি: ৯৯৯", [
      { text: language === "en" ? "Close" : "বন্ধ করুন", style: "cancel" },
      { text: language === "en" ? "Call 16767" : "১৬৭৬৭ কল করুন", onPress: () => callPhoneNumber("16767") }
    ]);
  };

  const showSettingsAlert = () => {
    Alert.alert(language === "en" ? "Settings" : "সেটিংস", language === "en" ? "Account settings" : "অ্যাকাউন্ট সেটিংস", [
      { text: language === "en" ? "Cancel" : "বাতিল", style: "cancel" },
      { text: language === "en" ? "Log out" : "লগ আউট", style: "destructive", onPress: logout }
    ]);
  };

  const displayName = profile?.name ?? copy.profile.name;
  const week = profile?.gestationalAgeWeeks ?? 28;

  return (
    <ScreenShell>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel={copy.common.back} accessibilityRole="button" onPress={goBack} style={styles.iconButton}>
          <Icon name="arrow-back" />
        </Pressable>
        <Text style={styles.title}>{copy.profile.title}</Text>
        <Pressable accessibilityLabel={language === "en" ? "Settings" : "সেটিংস"} accessibilityRole="button" onPress={showSettingsAlert} style={styles.iconButton}>
          <Icon name="settings" />
        </Pressable>
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
          [copy.profile.currentWeek, language === "en" ? `${week} weeks` : `${toBanglaNumber(week)} সপ্তাহ`],
          [copy.profile.bloodGroup, copy.profile.bloodGroupValue]
        ]}
      />

      <View style={styles.settings}>
        <SettingsRow icon="translate" label={t("profile.language")} value={t("profile.languageValue")} onPress={toggleLanguage} />
        <SettingsRow icon="security" label={copy.profile.security} onPress={requestPasswordReset} />
        <SettingsRow icon="help" label={copy.profile.help} onPress={showSupportAlert} />
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
  value,
  onPress
}: {
  icon: "translate" | "notifications" | "security" | "help";
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.settingsRow}>
      <Icon name={icon} color={colors.primary} />
      <Text style={styles.settingsLabel}>{label}</Text>
      {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
      <Icon name="chevron-right" color={colors.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44
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
