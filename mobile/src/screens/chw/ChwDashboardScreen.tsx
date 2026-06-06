import { useCallback, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, TextInput, Modal, Linking } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { getSession } from "@/auth/secureSession";
import { getLocalDbErrorMessage } from "@/db/localDbAccess";
import { getOutboxSummary } from "@/db/outbox";
import { getPatients } from "@/db/patients";
import { getVisitCountForChwSince } from "@/db/visits";
import { getRecentUnreadMessages, type ChatMessage } from "@/api/chatService";
import { useLanguage } from "@/context/LanguageContext";
import { useCopy } from "@/data/useCopy";
import { colors, radius, spacing, typography } from "@/theme";
import type { Patient } from "@/types/schema";
import { formatNumber } from "@/utils/localizedFormat";
import { getInitials, getRiskBorderColor } from "./helpers";
import { supabase } from "@/auth/supabaseAuth";
import * as ImagePicker from "expo-image-picker";

const DUMMY_CERT_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64ToBlob(base64: string, mimeType: string): Blob {
  const str = base64.replace(/=+$/, '');
  const len = str.length;
  const bytes = new Uint8Array(((len * 3) / 4) | 0);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = chars.indexOf(str[i]);
    const encoded2 = chars.indexOf(str[i + 1]);
    const encoded3 = i + 2 < len ? chars.indexOf(str[i + 2]) : 0;
    const encoded4 = i + 3 < len ? chars.indexOf(str[i + 3]) : 0;

    const value = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
    bytes[p++] = (value >> 16) & 255;
    if (i + 2 < len) bytes[p++] = (value >> 8) & 255;
    if (i + 3 < len) bytes[p++] = value & 255;
  }
  return new Blob([bytes], { type: mimeType });
}

type Summary = {
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
};

export default function ChwDashboardScreen() {
  const { language } = useLanguage();
  const copy = useCopy();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, failed: 0, lastSyncedAt: null });
  const [visitsToday, setVisitsToday] = useState(0);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);

  const [chwStatus, setChwStatus] = useState<{
    verification_status: "PENDING" | "APPROVED" | "REJECTED";
    is_active: boolean;
    rejection_reason: string | null;
    name?: string;
    organization_name?: string;
    worker_type?: string;
    years_of_experience?: number;
    working_area?: string;
    certificate_url?: string;
  } | null>(null);

  // Re-submit form states
  const [showEditForm, setShowEditForm] = useState(false);
  const [editOrgName, setEditOrgName] = useState("");
  const [editWorkerType, setEditWorkerType] = useState("");
  const [editExperience, setEditExperience] = useState("");
  const [editWorkingArea, setEditWorkingArea] = useState("");
  const [editCertUrlText, setEditCertUrlText] = useState("");
  const [editCertName, setEditCertName] = useState<string | null>(null);
  const [editCertBlob, setEditCertBlob] = useState<Blob | null>(null);
  const [editCertPickerVisible, setEditCertPickerVisible] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    const session = await getSession();
    if (!session) throw new Error(language === "en" ? "Session required" : "সেশন প্রয়োজন");

    // Fetch live CHW verification status
    try {
      const { data: chw, error: chwErr } = await supabase
        .from("chws")
        .select("verification_status, is_active, rejection_reason, name, organization_name, worker_type, years_of_experience, union_name, certificate_url")
        .eq("id", session.chwId)
        .maybeSingle();

      if (chw) {
        setChwStatus({
          verification_status: chw.verification_status,
          is_active: chw.is_active,
          rejection_reason: chw.rejection_reason,
          name: chw.name,
          organization_name: chw.organization_name,
          worker_type: chw.worker_type,
          years_of_experience: chw.years_of_experience,
          working_area: chw.union_name,
          certificate_url: chw.certificate_url
        });
      }
    } catch (err) {
      console.warn("Failed to fetch live CHW verification status", err);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [nextPatients, nextSummary, nextVisitsToday] = await Promise.all([
      getPatients(),
      getOutboxSummary(),
      getVisitCountForChwSince(session.chwId, startOfDay.toISOString())
    ]);

    setPatients(nextPatients);
    setSummary(nextSummary);
    setVisitsToday(nextVisitsToday);

    getRecentUnreadMessages(session.chwId, 3)
      .then(setRecentMessages)
      .catch(() => setRecentMessages([]));

    try {
      const Notifications = require("expo-notifications");
      const count = await Notifications.getBadgeCountAsync();
      setBadgeCount(count);
    } catch {
      setBadgeCount(0);
    }
  }, [language]);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => setLoadError(getLocalDbErrorMessage(error, copy.common.loadFailed)));
    }, [load, copy.common.loadFailed])
  );

  const nextPatient = patients[0] ?? null;
  const totalPatients = Math.max(patients.length, 1);
  const pendingVisits = Math.max(0, patients.length - visitsToday);
  const completionPercent = Math.min(100, Math.round((visitsToday / totalPatients) * 100));
  const riskSortedPatients = useMemo(
    () =>
      [...patients].sort((a, b) => {
        const rank = { HIGH: 0, MODERATE: 1, LOW: 2 };
        return rank[a.last_risk_level] - rank[b.last_risk_level];
      }),
    [patients]
  );

  const showNotifications = () => {
    const finalCount = badgeCount > 0 ? badgeCount : recentMessages.length;
    if (finalCount === 0) {
      Alert.alert(
        copy.chwDashboard.notificationsTitle,
        copy.chwDashboard.notificationsEmpty,
        [{ text: copy.common.close }]
      );
      return;
    }
    const msgList = recentMessages.length 
      ? recentMessages.map((message) => `• ${message.message}`).join("\n")
      : (language === "en" ? "You have unread messages in chat." : "আপনার চ্যাটে অপঠিত বার্তা রয়েছে।");
    Alert.alert(
      copy.chwDashboard.notificationsTitle,
      msgList,
      [
        { text: language === "en" ? "Open Chat" : "চ্যাট খুলুন", onPress: () => router.push("/(tabs)/chat") },
        { text: copy.common.close }
      ]
    );
  };

  const riskLabel = (level: "HIGH" | "MODERATE" | "LOW") => {
    if (level === "HIGH") return language === "en" ? "High" : "উচ্চ";
    if (level === "MODERATE") return language === "en" ? "Moderate" : "মধ্যম";
    return language === "en" ? "Low" : "নিম্ন";
  };

  const handleResubmit = async () => {
    if (!editOrgName.trim()) {
      Alert.alert(language === "en" ? "Error" : "ত্রুটি", language === "en" ? "Organization name required" : "প্রতিষ্ঠানের নাম প্রয়োজন");
      return;
    }
    if (!editWorkerType.trim()) {
      Alert.alert(language === "en" ? "Error" : "ত্রুটি", language === "en" ? "Worker type required" : "কর্মী ধরন প্রয়োজন");
      return;
    }
    if (!editWorkingArea.trim()) {
      Alert.alert(language === "en" ? "Error" : "ত্রুটি", language === "en" ? "Working area required" : "কর্ম এলাকা প্রয়োজন");
      return;
    }
    if (!editExperience.trim()) {
      Alert.alert(language === "en" ? "Error" : "ত্রুটি", language === "en" ? "Experience required" : "অভিজ্ঞতা বছর প্রয়োজন");
      return;
    }
    const exp = parseInt(editExperience.trim(), 10);
    if (isNaN(exp) || exp < 0) {
      Alert.alert(language === "en" ? "Error" : "ত্রুটি", language === "en" ? "Experience must be a valid number" : "অভিজ্ঞতা অবশ্যই একটি সঠিক সংখ্যা হতে হবে");
      return;
    }
    if (!editCertUrlText.trim() && !editCertBlob && !chwStatus?.certificate_url) {
      Alert.alert(language === "en" ? "Error" : "ত্রুটি", language === "en" ? "Certificate document is required" : "সার্টিফিকেট প্রমাণ প্রয়োজন");
      return;
    }

    setResubmitting(true);
    try {
      const session = await getSession();
      if (!session) throw new Error("No session found");

      let finalCertUrl = editCertUrlText.trim() || chwStatus?.certificate_url || null;

      if (editCertBlob) {
        const fileExt = editCertName ? editCertName.split('.').pop() : 'png';
        const fileName = `${session.chwId}_resubmit_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('certificates')
          .upload(fileName, editCertBlob, {
            contentType: 'image/' + (fileExt === 'jpg' ? 'jpeg' : fileExt),
            upsert: true
          });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from('certificates')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          finalCertUrl = urlData.publicUrl;
        }
      }

      const { error: updateErr } = await supabase
        .from("chws")
        .update({
          organization_name: editOrgName.trim(),
          worker_type: editWorkerType.trim(),
          years_of_experience: exp,
          union_name: editWorkingArea.trim(),
          certificate_url: finalCertUrl,
          verification_status: "PENDING",
          rejection_reason: null
        })
        .eq("id", session.chwId);

      if (updateErr) throw updateErr;

      Alert.alert(
        language === "en" ? "Success" : "সফল",
        language === "en" ? "Your application has been re-submitted for verification." : "আপনার আবেদনটি পুনরায় যাচাইয়ের জন্য পাঠানো হয়েছে।"
      );
      setShowEditForm(false);
      load();
    } catch (err: any) {
      Alert.alert(language === "en" ? "Failed" : "ব্যর্থ", err.message || "Something went wrong");
    } finally {
      setResubmitting(false);
    }
  };

  if (chwStatus && chwStatus.verification_status !== "APPROVED" && chwStatus.name !== "Demo CHW" && chwStatus.name !== "ডেমো কর্মী") {
    const isPending = chwStatus.verification_status === "PENDING";
    const isRejected = chwStatus.verification_status === "REJECTED";

    return (
      <View style={styles.blockScreen}>
        <ScrollView contentContainerStyle={styles.blockContent} keyboardShouldPersistTaps="handled">
          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>{copy.common.appName}</Text>
            <Text style={styles.blockSubtitle}>{language === "en" ? "Health Worker Portal" : "স্বাস্থ্যকর্মী পোর্টাল"}</Text>
          </View>

          <View style={[styles.statusCardLarge, isRejected && styles.statusCardRejected]}>
            <View style={styles.statusBadgeLarge}>
              <Icon
                name={isPending ? "hourglass-empty" : "error"}
                color={isPending ? "#E57A58" : "#ba1a1a"}
                size={32}
              />
              <Text style={[styles.statusTextLarge, { color: isPending ? "#E57A58" : "#ba1a1a" }]}>
                {isPending
                  ? (language === "en" ? "Verification Pending" : "যাচাইকরণ প্রক্রিয়াধীন")
                  : (language === "en" ? "Verification Rejected" : "যাচাইকরণ প্রত্যাখ্যাত")}
              </Text>
            </View>

            <Text style={styles.statusMessage}>
              {isPending
                ? (language === "en"
                    ? "Thank you for registering. An administrator is currently reviewing your professional credentials. You will receive access once approved."
                    : "নিবন্ধন করার জন্য ধন্যবাদ। একজন অ্যাডমিন বর্তমানে আপনার পেশাদার তথ্যাদি যাচাই করছেন। অনুমোদন সম্পন্ন হলে আপনি ড্যাশবোর্ড ব্যবহার করতে পারবেন।")
                : (language === "en"
                    ? "Unfortunately, your verification request was not approved. Please review the reason below and submit corrected details."
                    : "দুঃখিত, আপনার তথ্য যাচাইকরণ অনুমোদন করা হয়নি। অনুগ্রহ করে নিচের কারণটি দেখে সঠিক তথ্য পুনরায় জমা দিন।")}
            </Text>

            {isRejected && chwStatus.rejection_reason && (
              <View style={styles.rejectionBoxLarge}>
                <Text style={styles.rejectionBoxTitle}>
                  {language === "en" ? "Reason for Rejection:" : "প্রত্যাখ্যানের কারণ:"}
                </Text>
                <Text style={styles.rejectionBoxText}>{chwStatus.rejection_reason}</Text>
              </View>
            )}
          </View>

          {!showEditForm ? (
            <View style={styles.detailsCardLarge}>
              <Text style={styles.detailsTitle}>{language === "en" ? "Submitted Credentials" : "দাখিলকৃত বিবরণী"}</Text>
              
              <View style={styles.detailItemRow}>
                <Text style={styles.detailItemLabel}>{language === "en" ? "Name" : "নাম"}:</Text>
                <Text style={styles.detailItemValue}>{chwStatus.name}</Text>
              </View>
              <View style={styles.detailItemRow}>
                <Text style={styles.detailItemLabel}>{language === "en" ? "Organization" : "প্রতিষ্ঠান"}:</Text>
                <Text style={styles.detailItemValue}>{chwStatus.organization_name || "—"}</Text>
              </View>
              <View style={styles.detailItemRow}>
                <Text style={styles.detailItemLabel}>{language === "en" ? "Worker Type" : "কর্মীর ধরন"}:</Text>
                <Text style={styles.detailItemValue}>{chwStatus.worker_type || "—"}</Text>
              </View>
              <View style={styles.detailItemRow}>
                <Text style={styles.detailItemLabel}>{language === "en" ? "Experience" : "অভিজ্ঞতা"}:</Text>
                <Text style={styles.detailItemValue}>
                  {chwStatus.years_of_experience !== undefined
                    ? `${formatNumber(chwStatus.years_of_experience, language)} ${language === "en" ? "years" : "বছর"}`
                    : "—"}
                </Text>
              </View>
              <View style={styles.detailItemRow}>
                <Text style={styles.detailItemLabel}>{language === "en" ? "Working Area" : "কর্ম এলাকা"}:</Text>
                <Text style={styles.detailItemValue}>{chwStatus.working_area || "—"}</Text>
              </View>
              
              {chwStatus.certificate_url && (
                <Pressable
                  onPress={() => chwStatus.certificate_url && Linking.openURL(chwStatus.certificate_url)}
                  style={styles.viewDocBtn}
                >
                  <Icon name="insert-drive-file" color="#E57A58" size={18} />
                  <Text style={styles.viewDocBtnText}>
                    {language === "en" ? "View Submitted Certificate" : "দাখিলকৃত সার্টিফিকেট দেখুন"}
                  </Text>
                </Pressable>
              )}

              {isRejected && (
                <Pressable
                  onPress={() => {
                    setEditOrgName(chwStatus.organization_name || "");
                    setEditWorkerType(chwStatus.worker_type || "");
                    setEditExperience(String(chwStatus.years_of_experience || ""));
                    setEditWorkingArea(chwStatus.working_area || "");
                    setEditCertUrlText(chwStatus.certificate_url || "");
                    setEditCertName(null);
                    setEditCertBlob(null);
                    setShowEditForm(true);
                  }}
                  style={styles.resubmitBtn}
                >
                  <Text style={styles.resubmitBtnText}>
                    {language === "en" ? "Edit & Re-submit Application" : "তথ্য সংশোধন ও পুনরায় জমা দিন"}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.detailsCardLarge}>
              <Text style={styles.detailsTitle}>{language === "en" ? "Update Details" : "তথ্য সংশোধন করুন"}</Text>
              
              <TextInput
                onChangeText={setEditOrgName}
                placeholder={language === "en" ? "Organization Name" : "প্রতিষ্ঠানের নাম"}
                placeholderTextColor="#A0A0A0"
                style={styles.blockInput}
                value={editOrgName}
              />
              <TextInput
                onChangeText={setEditWorkerType}
                placeholder={language === "en" ? "Worker Type (e.g. HA, FWA)" : "কর্মী ধরন (যেমন: HA, FWA)"}
                placeholderTextColor="#A0A0A0"
                style={styles.blockInput}
                value={editWorkerType}
              />
              <TextInput
                keyboardType="numeric"
                onChangeText={setEditExperience}
                placeholder={language === "en" ? "Years of Experience" : "অভিজ্ঞতা (বছর)"}
                placeholderTextColor="#A0A0A0"
                style={styles.blockInput}
                value={editExperience}
              />
              <TextInput
                onChangeText={setEditWorkingArea}
                placeholder={language === "en" ? "Working Area (Union/Upazila)" : "কর্ম এলাকা (ইউনিয়ন/উপজেলা)"}
                placeholderTextColor="#A0A0A0"
                style={styles.blockInput}
                value={editWorkingArea}
              />

              <Pressable
                onPress={() => setEditCertPickerVisible(true)}
                style={[styles.blockUploadBox, editCertBlob && styles.blockUploadBoxActive]}
              >
                <Icon name={editCertBlob ? "check-circle" : "cloud-upload"} color={editCertBlob ? "#FFFFFF" : "#4A6047"} size={20} />
                <Text style={editCertBlob ? styles.blockUploadTextActive : styles.blockUploadText}>
                  {editCertBlob
                    ? (language === "en" ? `Selected: ${editCertName}` : `অনুমোদিত: ${editCertName}`)
                    : (language === "en" ? "Upload New Certificate File" : "নতুন সার্টিফিকেট ফাইল আপলোড")}
                </Text>
              </Pressable>

              <Text style={styles.orDividerTextBlock}>
                {language === "en" ? "— OR —" : "— অথবা —"}
              </Text>

              <TextInput
                onChangeText={setEditCertUrlText}
                placeholder={language === "en" ? "Certificate Link (URL)" : "সার্টিফিকেট লিংক (URL)"}
                placeholderTextColor="#A0A0A0"
                style={styles.blockInput}
                value={editCertUrlText}
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <Pressable
                  onPress={() => setShowEditForm(false)}
                  style={[styles.actionBtn, styles.cancelBtn]}
                >
                  <Text style={styles.cancelBtnText}>{language === "en" ? "Cancel" : "বাতিল"}</Text>
                </Pressable>
                <Pressable
                  onPress={handleResubmit}
                  disabled={resubmitting}
                  style={[styles.actionBtn, styles.submitBtn]}
                >
                  <Text style={styles.submitBtnText}>
                    {resubmitting ? (language === "en" ? "Submitting..." : "জমা হচ্ছে...") : (language === "en" ? "Submit" : "জমা দিন")}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          <Pressable
            onPress={async () => {
              try {
                const { clearRoleSession } = require("@/auth/roleSession");
                const { clearSession } = require("@/auth/secureSession");
                await supabase.auth.signOut().catch(() => undefined);
                await Promise.all([clearSession(), clearRoleSession()]).catch(() => undefined);
              } catch (e) {
                // ignore
              } finally {
                router.replace("/(auth)/login");
              }
            }}
            style={styles.logoutBtnLarge}
          >
            <Icon name="logout" color="#ba1a1a" size={18} />
            <Text style={styles.logoutBtnTextLarge}>
              {language === "en" ? "Log Out" : "লগ আউট করুন"}
            </Text>
          </Pressable>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={editCertPickerVisible}
          onRequestClose={() => setEditCertPickerVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditCertPickerVisible(false)} />
            <View style={styles.modalPanel}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {language === "en" ? "Select Certificate File" : "সার্টিফিকেট ফাইল নির্বাচন করুন"}
                </Text>
                <Pressable onPress={() => setEditCertPickerVisible(false)}>
                  <Icon name="close" size={24} color="#70605A" />
                </Pressable>
              </View>

              <View style={{ gap: 12, marginTop: 12, paddingBottom: 20 }}>
                <Pressable
                  onPress={async () => {
                    setEditCertPickerVisible(false);
                    try {
                      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
                      if (!result.canceled && result.assets && result.assets.length > 0) {
                        const asset = result.assets[0];
                        const response = await fetch(asset.uri);
                        const blob = await response.blob();
                        setEditCertBlob(blob);
                        setEditCertName(asset.fileName || "library_photo.png");
                      }
                    } catch {
                      Alert.alert(language === "en" ? "Error" : "ত্রুটি", language === "en" ? "Failed to open library" : "গ্যালারি খুলতে ব্যর্থ হয়েছে");
                    }
                  }}
                  style={styles.optionRow}
                >
                  <Icon name="image" color="#E57A58" size={24} />
                  <Text style={styles.optionText}>
                    {language === "en" ? "Choose Photo from Gallery" : "গ্যালারি থেকে ছবি নির্বাচন করুন"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    setEditCertPickerVisible(false);
                    try {
                      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
                      if (!permissionResult.granted) return;
                      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
                      if (!result.canceled && result.assets && result.assets.length > 0) {
                        const asset = result.assets[0];
                        const response = await fetch(asset.uri);
                        const blob = await response.blob();
                        setEditCertBlob(blob);
                        setEditCertName(asset.fileName || "camera_photo.png");
                      }
                    } catch {
                      Alert.alert(language === "en" ? "Error" : "ত্রুটি", language === "en" ? "Failed to open camera" : "ক্যামেরা খুলতে ব্যর্থ হয়েছে");
                    }
                  }}
                  style={styles.optionRow}
                >
                  <Icon name="photo-camera" color="#E57A58" size={24} />
                  <Text style={styles.optionText}>
                    {language === "en" ? "Take Photo with Camera" : "ক্যামেরা দিয়ে ছবি তুলুন"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    try {
                      const blob = base64ToBlob(DUMMY_CERT_BASE64, "image/png");
                      setEditCertBlob(blob);
                      setEditCertName("Demo Certificate (Mock).png");
                      setEditCertPickerVisible(false);
                    } catch {
                      Alert.alert(language === "en" ? "Error" : "ত্রুটি", language === "en" ? "Failed to process certificate" : "সার্টিফিকেট প্রসেস করতে ব্যর্থ হয়েছে");
                    }
                  }}
                  style={styles.optionRow}
                >
                  <Icon name="description" color="#E57A58" size={24} />
                  <Text style={styles.optionText}>
                    {language === "en" ? "Use Demo Mock Certificate" : "ডেমো ডকুমেন্ট যুক্ত করুন (Mock)"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerTitle}>{copy.common.appName}</Text>
          <Text style={styles.headerSubtitle}>{copy.chwDashboard.subtitle}</Text>
        </View>
        <Pressable accessibilityLabel={language === "en" ? "Notifications" : "নোটিফিকেশন"} accessibilityRole="button" onPress={showNotifications} style={styles.iconButton}>
          <Icon name="notifications" color="#70605A" size={24} />
          {(badgeCount > 0 || recentMessages.length > 0) ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{formatNumber(badgeCount > 0 ? badgeCount : recentMessages.length, language)}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <Icon name="cloud-done" color="#4A6047" size={17} />
            <Text style={styles.statusText}>
              {summary.pending ? `${formatNumber(summary.pending, language)} ${language === "en" ? "Pending" : "অপেক্ষমাণ"}` : copy.chwDashboard.syncDone}
            </Text>
          </View>
          <View style={styles.aiPill}>
            <View style={styles.aiDot} />
            <Text style={styles.aiText}>{language === "en" ? "AI Active" : "AI সক্রিয়"}</Text>
          </View>
        </View>

        {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => nextPatient && router.push(`/assessment/${nextPatient.id}`)}
          style={styles.nextCard}
        >
          <View style={styles.nextText}>
            <Text style={styles.nextKicker}>{copy.chwDashboard.nextPatientKicker}</Text>
            <Text style={styles.nextName}>{nextPatient?.name ?? (language === "en" ? "No patient today" : "আজকের রোগী নেই")}</Text>
            <Text style={styles.nextMeta}>
              {nextPatient ? `${language === "en" ? "Week" : "সপ্তাহ"} ${formatNumber(nextPatient.gestational_age_weeks, language)}` : (language === "en" ? "Check patient tab for list" : "রোগী ট্যাব থেকে তালিকা দেখুন")}
            </Text>
          </View>
          <View style={styles.visitButton}>
            <Text style={styles.visitButtonText}>{copy.chwDashboard.startVisit}</Text>
            <Icon name="chevron-right" color="#FFFFFF" size={20} />
          </View>
        </Pressable>

        {/* Verification Card */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/verifications")}
          style={styles.verificationCard}
        >
          <View style={styles.verificationIcon}>
            <Icon name="verified" color="#FFFFFF" size={22} />
          </View>
          <View style={styles.verificationTextWrap}>
            <Text style={styles.verificationTitle}>
              {language === "en" ? "Maa Verification Requests" : "মায়ের যাচাইকরণ অনুরোধ"}
            </Text>
            <Text style={styles.verificationDesc}>
              {language === "en" ? "Review certificate uploads & verify accounts" : "সার্টিফিকেট আপলোড দেখে অ্যাকাউন্ট অনুমোদন করুন"}
            </Text>
          </View>
          <Icon name="chevron-right" color="#E57A58" size={20} />
        </Pressable>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>{language === "en" ? "Today's Progress" : "আজকের অগ্রগতি"}</Text>
          <View style={styles.statsGrid}>
            <Stat label={copy.chwDashboard.statActive} value={patients.length} />
            <Stat label={copy.chwDashboard.statCompleted} value={visitsToday} />
            <Stat label={copy.chwDashboard.statPending} value={pendingVisits} />
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(6, completionPercent)}%` }]} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{language === "en" ? "Patient Triage" : "রোগী ট্রায়াজ"}</Text>
          <Pressable onPress={() => router.push("/(tabs)/patients")}>
            <Text style={styles.linkText}>{copy.chwDashboard.openList}</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.triageScroll}>
          {riskSortedPatients.map((patient) => (
            <Pressable
              key={patient.id}
              onPress={() => router.push(`/assessment/${patient.id}`)}
              style={[styles.triageCard, { borderTopColor: getRiskBorderColor(patient.last_risk_level) }]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(patient.name)}</Text>
              </View>
              <Text numberOfLines={1} style={styles.triageName}>{patient.name}</Text>
              <Text style={styles.triageWeek}>{language === "en" ? "Week" : "সপ্তাহ"} {formatNumber(patient.gestational_age_weeks, language)}</Text>
              <Text style={[styles.riskText, { color: getRiskBorderColor(patient.last_risk_level) }]}>
                {riskLabel(patient.last_risk_level)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.chatSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{language === "en" ? "Recent Chat" : "সাম্প্রতিক চ্যাট"}</Text>
            <Pressable onPress={() => router.push("/(tabs)/chat")}>
              <Text style={styles.linkText}>{copy.chwDashboard.openList}</Text>
            </Pressable>
          </View>
          {recentMessages.length ? (
            recentMessages.map((message) => (
              <Pressable key={message.id} onPress={() => router.push("/(tabs)/chat")} style={styles.messageRow}>
                <View style={styles.messageAvatar}>
                  <Icon name="chat-bubble" color="#E57A58" size={18} />
                </View>
                <View style={styles.messageTextWrap}>
                  <Text style={styles.messageTitle}>{language === "en" ? "Mother's message" : "মায়ের বার্তা"}</Text>
                  <Text numberOfLines={1} style={styles.messagePreview}>{message.message}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>{language === "en" ? "No unread messages" : "অপঠিত বার্তা নেই"}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { language } = useLanguage();
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{formatNumber(value, language)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFF9F6",
    flex: 1
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "#FFF9F6",
    borderBottomColor: "#F5ECE9",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 52, android: 56, default: 16 })
  },
  headerTitle: {
    color: "#E57A58",
    fontSize: 22,
    fontWeight: "bold"
  },
  headerSubtitle: {
    color: "#70605A",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#FCEBE5",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44
  },
  badge: {
    alignItems: "center",
    backgroundColor: "#ba1a1a",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    position: "absolute",
    right: -2,
    top: -2
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold"
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 40
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  statusPill: {
    alignItems: "center",
    backgroundColor: "#EDF4EB",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  statusText: {
    color: "#4A6047",
    fontSize: 12,
    fontWeight: "bold"
  },
  aiPill: {
    alignItems: "center",
    backgroundColor: "#DCE8D7",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  aiDot: {
    backgroundColor: "#4A6047",
    borderRadius: 4,
    height: 8,
    width: 8
  },
  aiText: {
    color: "#4A6047",
    fontSize: 12,
    fontWeight: "bold"
  },
  errorText: {
    ...typography.caption,
    color: colors.error
  },
  nextCard: {
    backgroundColor: "#E57A58",
    borderRadius: 18,
    gap: 14,
    padding: 20
  },
  verificationCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12
  },
  verificationIcon: {
    backgroundColor: "#E57A58",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  verificationTextWrap: {
    flex: 1,
    gap: 2
  },
  verificationTitle: {
    color: "#4A3E39",
    fontSize: 15,
    fontWeight: "bold"
  },
  verificationDesc: {
    color: "#70605A",
    fontSize: 12
  },
  nextText: {
    gap: 4
  },
  nextKicker: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "bold"
  },
  nextName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold"
  },
  nextMeta: {
    color: "#FFF5F2",
    fontSize: 14,
    fontWeight: "600"
  },
  visitButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 22,
    flexDirection: "row",
    gap: 4,
    minHeight: 42,
    paddingHorizontal: 14
  },
  visitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  sectionTitle: {
    color: "#4A3E39",
    fontSize: 18,
    fontWeight: "bold"
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10
  },
  statItem: {
    backgroundColor: "#FFF9F6",
    borderRadius: 12,
    flex: 1,
    padding: 12
  },
  statValue: {
    color: "#E57A58",
    fontSize: 22,
    fontWeight: "bold"
  },
  statLabel: {
    color: "#70605A",
    fontSize: 12,
    fontWeight: "600"
  },
  progressTrack: {
    backgroundColor: "#EBDCD9",
    borderRadius: 4,
    height: 8,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: "#70605A",
    height: "100%"
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  linkText: {
    color: "#E57A58",
    fontSize: 13,
    fontWeight: "bold"
  },
  triageScroll: {
    gap: 12,
    paddingRight: 20
  },
  triageCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 16,
    borderTopWidth: 4,
    borderWidth: 1,
    gap: 6,
    padding: 14,
    width: 132
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },
  triageName: {
    color: "#4A3E39",
    fontSize: 14,
    fontWeight: "bold"
  },
  triageWeek: {
    color: "#70605A",
    fontSize: 12
  },
  riskText: {
    fontSize: 12,
    fontWeight: "bold"
  },
  chatSection: {
    gap: 10
  },
  messageRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12
  },
  messageAvatar: {
    alignItems: "center",
    backgroundColor: "#FCEBE5",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  messageTextWrap: {
    flex: 1
  },
  messageTitle: {
    color: "#4A3E39",
    fontSize: 13,
    fontWeight: "bold"
  },
  messagePreview: {
    color: "#70605A",
    fontSize: 12
  },
  emptyChat: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16
  },
  emptyChatText: {
    color: "#70605A",
    textAlign: "center"
  },
  blockScreen: {
    flex: 1,
    backgroundColor: "#FFF9F6"
  },
  blockContent: {
    padding: 24,
    gap: 20,
    alignItems: "stretch",
    paddingBottom: 48
  },
  blockHeader: {
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 44 : 24,
    marginBottom: 8
  },
  blockTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#E57A58"
  },
  blockSubtitle: {
    fontSize: 14,
    color: "#70605A",
    fontWeight: "600"
  },
  statusCardLarge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderColor: "#EBDCD9",
    borderWidth: 1,
    gap: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6
  },
  statusCardRejected: {
    borderColor: "#ba1a1a"
  },
  statusBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  statusTextLarge: {
    fontSize: 18,
    fontWeight: "bold"
  },
  statusMessage: {
    fontSize: 14,
    color: "#70605A",
    textAlign: "center",
    lineHeight: 20
  },
  rejectionBoxLarge: {
    backgroundColor: "#FDF2F2",
    borderColor: "#F5C2C2",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    width: "100%",
    gap: 4
  },
  rejectionBoxTitle: {
    color: "#ba1a1a",
    fontWeight: "bold",
    fontSize: 13
  },
  rejectionBoxText: {
    color: "#410002",
    fontSize: 14
  },
  detailsCardLarge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderColor: "#EBDCD9",
    borderWidth: 1,
    gap: 10
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A3E39",
    marginBottom: 4
  },
  detailItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE9"
  },
  detailItemLabel: {
    color: "#70605A",
    fontWeight: "600",
    fontSize: 14
  },
  detailItemValue: {
    color: "#4A3E39",
    fontWeight: "bold",
    fontSize: 14
  },
  viewDocBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: "#FCEBE5",
    borderRadius: 12
  },
  viewDocBtnText: {
    color: "#E57A58",
    fontSize: 14,
    fontWeight: "bold"
  },
  resubmitBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 14,
    backgroundColor: "#E57A58",
    borderRadius: 12
  },
  resubmitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },
  logoutBtnLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderColor: "#ba1a1a",
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: "transparent"
  },
  logoutBtnTextLarge: {
    color: "#ba1a1a",
    fontSize: 15,
    fontWeight: "bold"
  },
  blockInput: {
    backgroundColor: "#FFF9F6",
    borderColor: "#EBDCD9",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#4A3E39"
  },
  blockUploadBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF9F6",
    borderColor: "#EBDCD9",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 4
  },
  blockUploadBoxActive: {
    backgroundColor: "#E57A58",
    borderColor: "#E57A58",
    borderStyle: "solid"
  },
  blockUploadText: {
    color: "#4A6047",
    fontSize: 14,
    fontWeight: "600"
  },
  blockUploadTextActive: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  orDividerTextBlock: {
    textAlign: "center",
    color: "#A08E88",
    fontSize: 11,
    marginVertical: 2,
    fontWeight: "bold"
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12
  },
  cancelBtn: {
    backgroundColor: "#F5ECE9"
  },
  cancelBtnText: {
    color: "#70605A",
    fontSize: 14,
    fontWeight: "bold"
  },
  submitBtn: {
    backgroundColor: "#E57A58"
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
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
    paddingBottom: Platform.OS === "ios" ? 44 : 32,
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
    color: "#E57A58"
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EBDCD9"
  },
  optionText: {
    color: "#54433d",
    fontSize: 16
  }
});
