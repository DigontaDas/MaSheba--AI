import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, Modal, TextInput, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { clearSession } from "@/auth/secureSession";
import { clearRoleSession, getCurrentMotherProfile, saveMotherId, type MotherProfile } from "@/auth/roleSession";
import { supabase, signUpAndBootstrap } from "@/auth/supabaseAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useCopy } from "@/data/useCopy";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import { callPhoneNumber } from "@/utils/phone";
import { getPregnancyWeeks } from "@/utils/pregnancy";
import * as Network from "expo-network";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

function getEDD(lmpDateStr: string | null | undefined): string {
  if (!lmpDateStr) return "-";
  try {
    const lmp = new Date(lmpDateStr);
    if (isNaN(lmp.getTime())) return "-";
    const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
    return edd.toISOString().split("T")[0];
  } catch {
    return "-";
  }
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<MotherProfile | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const copy = useCopy();

  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncEmail, setSyncEmail] = useState("");
  const [syncPassword, setSyncPassword] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    getCurrentMotherProfile().then(setProfile).catch(() => undefined);
  }, []);

  const syncOfflineAccount = async (emailInput: string, passwordInput: string) => {
    if (!profile) return;
    if (!emailInput.trim() || !passwordInput.trim()) {
      Alert.alert(
        language === "bn" ? "ভুল ইনপুট" : "Invalid Input",
        language === "bn" ? "সবগুলো ঘর পূরণ করুন।" : "Please fill in all fields."
      );
      return;
    }

    setSyncLoading(true);
    try {
      const { sessionEstablished } = await signUpAndBootstrap(
        emailInput.trim(),
        passwordInput.trim(),
        "mother",
        profile.name,
        {
          gestational_age_weeks: profile.gestationalAgeWeeks
        }
      );

      if (sessionEstablished) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: motherData } = await supabase
            .from("mothers")
            .select("id")
            .eq("auth_user_id", user.id)
            .maybeSingle();

          if (motherData?.id) {
            const realId = motherData.id;
            
            // Delete offline credentials and profile caches
            await AsyncStorage.removeItem(`maasheba.offline_profile_${profile.id}`).catch(() => undefined);
            await SecureStore.deleteItemAsync(`maasheba.offline_creds_email_${profile.id}`).catch(() => undefined);
            await SecureStore.deleteItemAsync(`maasheba.offline_creds_password_${profile.id}`).catch(() => undefined);
            
            // Save new online session
            await saveMotherId(realId);
            
            // Save synced credentials for the real ID offline
            await SecureStore.setItemAsync(
              `maasheba.offline_creds_email_${realId}`,
              emailInput.trim()
            ).catch(() => undefined);
            await SecureStore.setItemAsync(
              `maasheba.offline_creds_password_${realId}`,
              passwordInput.trim()
            ).catch(() => undefined);
            
            // Re-fetch profile
            const updatedProfile = await getCurrentMotherProfile();
            setProfile(updatedProfile);

            Alert.alert(
              language === "bn" ? "সিঙ্ক সফল!" : "Sync Successful!",
              language === "bn"
                ? "আপনার অ্যাকাউন্ট সফলভাবে ক্লাউডের সাথে সিঙ্ক হয়েছে।"
                : "Your account has been successfully synced with the cloud."
            );
            setSyncModalVisible(false);
          } else {
            throw new Error("Unable to retrieve Supabase mother profile ID");
          }
        } else {
          throw new Error("Unable to retrieve Supabase user");
        }
      } else {
        Alert.alert(
          language === "bn" ? "নিবন্ধন সম্পন্ন" : "Registration Complete",
          language === "bn"
            ? "আপনার অ্যাকাউন্ট ক্লাউডে তৈরি হয়েছে। সক্রিয় করতে ও লগইন করতে দয়া করে ইন্টারনেট চালু রেখে আবার লগইন করুন।"
            : "Your account is created. Please verify and log in normally."
        );
        setSyncModalVisible(false);
      }
    } catch (err: any) {
      Alert.alert(
        language === "bn" ? "সিঙ্ক ব্যর্থ" : "Sync Failed",
        err?.message || (language === "bn" ? "কোনো সমস্যা হয়েছে" : "An error occurred")
      );
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSyncWithCloud = async () => {
    if (!profile) return;
    const net = await Network.getNetworkStateAsync().catch(() => ({ isConnected: false, isInternetReachable: false }));
    const isOnline = net.isConnected && net.isInternetReachable !== false;
    if (!isOnline) {
      Alert.alert(
        language === "bn" ? "ইন্টারনেট সংযোগ নেই" : "No Internet Connection",
        language === "bn"
          ? "অনলাইন ক্লাউড সিঙ্ক করতে দয়া করে ইন্টারনেট সচল করুন।"
          : "Please connect to the internet to perform cloud synchronization."
      );
      return;
    }

    const emailStored = await SecureStore.getItemAsync(`maasheba.offline_creds_email_${profile.id}`).catch(() => null);
    const passwordStored = await SecureStore.getItemAsync(`maasheba.offline_creds_password_${profile.id}`).catch(() => null);

    if (emailStored && passwordStored) {
      Alert.alert(
        language === "bn" ? "অনলাইন ক্লাউড সিঙ্ক" : "Sync with Cloud",
        language === "bn"
          ? `আপনার তথ্যগুলি ইমেইল/ফোন "${emailStored}" এর সাথে ক্লাউডে সিঙ্ক করা হবে। আপনি কি রাজি?`
          : `Syncing your progress to cloud under "${emailStored}". Proceed?`,
        [
          { text: language === "bn" ? "বাতিল" : "Cancel", style: "cancel" },
          {
            text: language === "bn" ? "হ্যাঁ, সিঙ্ক করুন" : "Yes, Sync",
            onPress: () => void syncOfflineAccount(emailStored, passwordStored)
          }
        ]
      );
      return;
    }

    setSyncModalVisible(true);
  };

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
  const week = getPregnancyWeeks(profile?.lmpDate, profile?.gestationalAgeWeeks);
  const eddDate = getEDD(profile?.lmpDate);

  // Determine verification status label and color
  let statusLabel = "";
  let statusColor: string = colors.secondary;
  let statusIcon: IconName = "verified";

  if (profile?.id && profile.id.startsWith("offline-mother-")) {
    statusLabel = language === "en" ? "Offline Guest Mode" : "অফলাইন গেস্ট মোড";
    statusColor = colors.outline;
    statusIcon = "cloud-off";
  } else if (profile?.verificationStatus === "PENDING") {
    statusLabel = language === "en" ? "Pending Verification" : "যাচাইকরণ পেন্ডিং";
    statusColor = colors.outline;
    statusIcon = "history";
  } else if (profile?.verificationStatus === "REJECTED") {
    statusLabel = language === "en" ? "Rejected" : "অনুমোদন মেলেনি";
    statusColor = colors.error;
    statusIcon = "error";
  } else {
    statusLabel = copy.profile.verifiedMother;
    statusColor = colors.secondary;
    statusIcon = "verified";
  }

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
        <View style={[styles.verified, { backgroundColor: statusColor + "15" }]}>
          <Icon name={statusIcon} color={statusColor} size={16} />
          <Text style={[styles.verifiedText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {profile?.verificationStatus === "REJECTED" && profile?.rejectionReason ? (
          <View style={styles.rejectionReasonBox}>
            <Text style={styles.rejectionReasonLabel}>
              {language === "bn" ? "প্রত্যাখ্যানের কারণ:" : "Reason for Rejection:"}
            </Text>
            <Text style={styles.rejectionReasonText}>{profile.rejectionReason}</Text>
          </View>
        ) : null}
      </View>

      {profile?.id && profile.id.startsWith("offline-mother-") && (
        <Pressable
          onPress={handleSyncWithCloud}
          style={styles.syncBanner}
        >
          <View style={styles.syncBannerContent}>
            <Icon name="cloud-upload" color="#FFFFFF" size={24} />
            <View style={styles.syncBannerTextWrap}>
              <Text style={styles.syncBannerTitle}>
                {language === "bn" ? "অনলাইন ক্লাউড ব্যাকআপ সিঙ্ক" : "Sync Cloud Backup Online"}
              </Text>
              <Text style={styles.syncBannerSubtitle}>
                {language === "bn" 
                  ? "ডাটা সুরক্ষিত করতে আপনার অ্যাকাউন্ট সিঙ্ক করুন।" 
                  : "Tap to register and back up your data online."}
              </Text>
            </View>
          </View>
        </Pressable>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={syncModalVisible}
        onRequestClose={() => setSyncModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSyncModalVisible(false)} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === "bn" ? "অনলাইন ক্লাউড সিঙ্ক" : "Sync with Cloud"}
              </Text>
              <Pressable onPress={() => setSyncModalVisible(false)}>
                <Icon name="close" color="#70605A" size={24} />
              </Pressable>
            </View>

            <View style={{ gap: 12, paddingBottom: 20 }}>
              <Text style={styles.modalSubtext}>
                {language === "bn" 
                  ? "আপনার অফলাইন ডাটা ব্যাকআপ নিতে অনুগ্রহ করে একটি সচল ইমেইল/ফোন এবং পাসওয়ার্ড দিয়ে অনলাইন অ্যাকাউন্ট তৈরি করুন।" 
                  : "To back up your offline data, please create an online account with an active email/phone and password."}
              </Text>

              <TextInput
                autoCapitalize="none"
                onChangeText={setSyncEmail}
                placeholder={language === "bn" ? "ইমেইল বা মোবাইল নম্বর" : "Email or Phone Number"}
                placeholderTextColor="#A0A0A0"
                style={styles.modalInput}
                value={syncEmail}
              />

              <TextInput
                onChangeText={setSyncPassword}
                placeholder={language === "bn" ? "পাসওয়ার্ড" : "Password"}
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                style={styles.modalInput}
                value={syncPassword}
              />

              <Pressable
                disabled={syncLoading}
                onPress={() => void syncOfflineAccount(syncEmail, syncPassword)}
                style={({ pressed }) => [
                  styles.modalSubmitButton,
                  pressed && styles.pressed,
                  syncLoading && styles.disabled
                ]}
              >
                {syncLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>
                    {language === "bn" ? "সিঙ্ক করুন এবং অ্যাকাউন্ট তৈরি করুন" : "Sync & Create Account"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
          [copy.profile.edd, eddDate],
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
  rejectionReasonBox: {
    alignItems: "center",
    backgroundColor: colors.errorContainer,
    borderRadius: radius.card,
    gap: spacing.xs,
    padding: spacing.base,
    marginTop: spacing.sm,
    width: "100%"
  },
  rejectionReasonLabel: {
    ...typography.label,
    color: colors.onErrorContainer,
    fontFamily: typography.h2.fontFamily
  },
  rejectionReasonText: {
    ...typography.body,
    color: colors.onErrorContainer,
    textAlign: "center"
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
  },
  syncBanner: {
    backgroundColor: "#E57A58",
    borderRadius: radius.card,
    padding: spacing.base,
    marginTop: spacing.base,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  syncBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base
  },
  syncBannerTextWrap: {
    flex: 1,
    gap: 2
  },
  syncBannerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: typography.h2.fontFamily
  },
  syncBannerSubtitle: {
    fontSize: 13,
    color: "#FFF0EB",
    fontFamily: typography.body.fontFamily
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  modalPanel: {
    backgroundColor: "#FFF9F6",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    width: "100%"
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E57A58",
    fontFamily: typography.h2.fontFamily
  },
  modalSubtext: {
    fontSize: 14,
    color: "#70605A",
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: typography.body.fontFamily
  },
  modalInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBDCD9",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#54433d"
  },
  modalSubmitButton: {
    backgroundColor: "#E57A58",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  modalSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: typography.h2.fontFamily
  },
  pressed: {
    opacity: 0.8
  },
  disabled: {
    opacity: 0.6
  }
});
