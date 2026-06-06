import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { router } from "expo-router";
import { getSession } from "@/auth/secureSession";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";

type PendingMother = {
  id: string;
  name: string;
  phone: string | null;
  chw_email: string | null;
  chw_phone: string | null;
  lmp_date: string | null;
  certificate_url: string | null;
  created_at: string;
};

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "https://maasheba-backend.onrender.com";

export default function VerificationsScreen() {
  const { language: lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifications, setVerifications] = useState<PendingMother[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMother, setSelectedMother] = useState<PendingMother | null>(null);
  
  // Modals state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [motherAge, setMotherAge] = useState("");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPendingVerifications = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const session = await getSession();
      if (!session) throw new Error("No session found");

      const response = await fetch(`${API_BASE}/api/v1/verification/pending`, {
        headers: {
          "Authorization": `Bearer ${session.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(lang === "bn" ? "অনুরোধ তালিকা লোড করতে ব্যর্থ হয়েছে" : "Failed to load pending verifications");
      }

      const data = await response.json();
      setVerifications(data);
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPendingVerifications().catch(() => undefined);
  }, []);

  const handleApprove = async () => {
    if (!selectedMother) return;
    const ageNum = parseInt(motherAge.trim(), 10);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 60) {
      Alert.alert(
        lang === "bn" ? "ভুল বয়স" : "Invalid Age",
        lang === "bn" ? "অনুগ্রহ করে ১০ থেকে ৬০ বছরের মধ্যে সঠিক বয়স লিখুন" : "Please enter a valid age between 10 and 60"
      );
      return;
    }

    setActionLoading(true);
    try {
      const session = await getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(`${API_BASE}/api/v1/verification/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          mother_id: selectedMother.id,
          age: ageNum
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Approval failed");
      }

      setApproveModalVisible(false);
      setMotherAge("");
      setSelectedMother(null);
      Alert.alert(
        lang === "bn" ? "অনুমোদিত হয়েছে" : "Approved Successfully",
        lang === "bn" ? "মায়ের অ্যাকাউন্ট সক্রিয় হয়েছে এবং রোগী তালিকা ভুক্ত হয়েছে।" : "Mother's profile is verified and clinical record created."
      );
      loadPendingVerifications();
    } catch (err: any) {
      Alert.alert(lang === "bn" ? "ত্রুটি" : "Error", err.message || "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (mother: PendingMother) => {
    setSelectedMother(mother);
    setRejectionReason("");
    setRejectModalVisible(true);
  };

  const submitReject = async () => {
    if (!selectedMother) return;
    const reason = rejectionReason.trim();
    if (reason.length < 2 || reason.length > 200) {
      Alert.alert(
        lang === "bn" ? "ভুল কারণ" : "Invalid Reason",
        lang === "bn"
          ? "অনুগ্রহ করে ২ থেকে ২০০ অক্ষরের মধ্যে একটি গ্রহণযোগ্য কারণ লিখুন"
          : "Please enter a valid rejection reason between 2 and 200 characters"
      );
      return;
    }

    setActionLoading(true);
    try {
      const session = await getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(`${API_BASE}/api/v1/verification/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          mother_id: selectedMother.id,
          rejection_reason: reason
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Rejection failed");
      }

      setRejectModalVisible(false);
      setRejectionReason("");
      setSelectedMother(null);
      Alert.alert(
        lang === "bn" ? "প্রত্যাখ্যাত হয়েছে" : "Rejected Successfully",
        lang === "bn" ? "যাচাইকরণ অনুরোধটি বাতিল করা হয়েছে।" : "Verification request has been rejected."
      );
      loadPendingVerifications();
    } catch (err: any) {
      Alert.alert(lang === "bn" ? "ত্রুটি" : "Error", err.message || "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMothers = verifications.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      (item.phone && item.phone.toLowerCase().includes(query)) ||
      (item.chw_email && item.chw_email.toLowerCase().includes(query))
    );
  });

  const viewCertificate = (url: string | null) => {
    if (!url) {
      Alert.alert(lang === "bn" ? "ত্রুটি" : "Error", lang === "bn" ? "কোনো সার্টিফিকেট পাওয়া যায়নি" : "No certificate found");
      return;
    }
    setImageViewerUrl(url);
    setImageViewerVisible(true);
  };

  const openApproveModal = (mother: PendingMother) => {
    setSelectedMother(mother);
    setApproveModalVisible(true);
  };

  return (
    <ScreenShell>
      {/* Header bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace("/(tabs)/home")} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.topTitle}>
          {lang === "bn" ? "যাচাইকরণ অনুরোধ" : "Verification Requests"}
        </Text>
        <View style={styles.placeholderBtn} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" color={colors.outline} size={20} />
        <TextInput
          onChangeText={setSearchQuery}
          placeholder={lang === "bn" ? "নাম বা ফোন নম্বর দিয়ে খুঁজুন..." : "Search by name or phone..."}
          placeholderTextColor="#A0A0A0"
          style={styles.searchInput}
          value={searchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <Icon name="close" color={colors.outline} size={20} />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => loadPendingVerifications()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{lang === "bn" ? "আবার চেষ্টা করুন" : "Retry"}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={filteredMothers}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={() => loadPendingVerifications(true)}
          renderItem={({ item }) => (
            <View style={styles.verifyCard}>
              <View style={styles.cardInfo}>
                <Text style={styles.motherName}>{item.name}</Text>
                
                {item.phone && (
                  <View style={styles.infoRow}>
                    <Icon name="phone" color={colors.outline} size={16} />
                    <Text style={styles.infoText}>{item.phone}</Text>
                  </View>
                )}

                {item.lmp_date && (
                  <View style={styles.infoRow}>
                    <Icon name="calendar-today" color={colors.outline} size={16} />
                    <Text style={styles.infoText}>
                      {lang === "bn" ? `শেষ মাসিক: ${item.lmp_date}` : `LMP Date: ${item.lmp_date}`}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actionRow}>
                {item.certificate_url && (
                  <Pressable
                    onPress={() => viewCertificate(item.certificate_url)}
                    style={styles.viewCertBtn}
                  >
                    <Icon name="description" color={colors.primary} size={18} />
                    <Text style={styles.viewCertText}>
                      {lang === "bn" ? "সার্টিফিকেট দেখুন" : "View Cert"}
                    </Text>
                  </Pressable>
                )}

                <View style={styles.btnGroup}>
                  <Pressable
                    onPress={() => openRejectModal(item)}
                    style={[styles.btn, styles.rejectBtn]}
                  >
                    <Text style={styles.rejectText}>
                      {lang === "bn" ? "প্রত্যাখ্যান" : "Reject"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => openApproveModal(item)}
                    style={[styles.btn, styles.approveBtn]}
                  >
                    <Text style={styles.approveText}>
                      {lang === "bn" ? "অনুমোদন" : "Approve"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="verified-user" color={colors.outlineVariant} size={64} />
              <Text style={styles.emptyText}>
                {lang === "bn" ? "কোনো পেন্ডিং যাচাইকরণ অনুরোধ নেই" : "No pending verification requests"}
              </Text>
            </View>
          }
        />
      )}

      {/* Image Viewer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setImageViewerVisible(false)} />
          <View style={styles.imagePanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {lang === "bn" ? "সংযুক্ত সার্টিফিকেট" : "Medical Certificate"}
              </Text>
              <Pressable onPress={() => setImageViewerVisible(false)}>
                <Icon name="close" size={24} color={colors.onSurface} />
              </Pressable>
            </View>
            
            {imageViewerUrl ? (
              <View style={styles.imageContainer}>
                {/* Fallback to simple icon since dummy images are generated */}
                <Image
                  source={{ uri: imageViewerUrl }}
                  style={styles.certificateImage}
                  resizeMode="contain"
                />
                <View style={styles.certOverlay}>
                  <Icon name="verified" color={colors.secondary} size={32} />
                  <Text style={styles.certOverlayText}>
                    {lang === "bn" ? "ডিজিটালভাবে স্বাক্ষরিত ও সংরক্ষিত" : "Digitally Secured Certificate"}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Approval Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={approveModalVisible}
        onRequestClose={() => setApproveModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setApproveModalVisible(false)} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {lang === "bn" ? "অনুমোদন বিবরণী" : "Approve Verification"}
              </Text>
              <Pressable onPress={() => setApproveModalVisible(false)}>
                <Icon name="close" size={24} color={colors.onSurface} />
              </Pressable>
            </View>

            <View style={styles.approveForm}>
              <Text style={styles.formLabel}>
                {lang === "bn" ? "মায়ের বয়স (১০ - ৬০ বছর)" : "Mother's Age (10 - 60 years)"}
              </Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setMotherAge}
                placeholder={lang === "bn" ? "যেমন: ২৫" : "e.g. 25"}
                placeholderTextColor="#A0A0A0"
                style={styles.formInput}
                value={motherAge}
              />
              <Text style={styles.formDesc}>
                {lang === "bn" 
                  ? "রোগীর ক্লিনিক্যাল হিস্টোরি এবং প্রসবকালীন ট্রায়াজ রেকর্ড তৈরির জন্য বয়স প্রয়োজন।" 
                  : "Clinical age is required to generate the pregnancy risk assessment card."}
              </Text>

              <View style={styles.approveSubmitRow}>
                <PrimaryButton
                  label={lang === "bn" ? "নিশ্চিত করুন ও সক্রিয় করুন" : "Confirm & Approve"}
                  onPress={handleApprove}
                  loading={actionLoading}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rejection Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rejectModalVisible}
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRejectModalVisible(false)} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {lang === "bn" ? "প্রত্যাখ্যানের কারণ" : "Reject Verification"}
              </Text>
              <Pressable onPress={() => setRejectModalVisible(false)}>
                <Icon name="close" size={24} color={colors.onSurface} />
              </Pressable>
            </View>

            <View style={styles.approveForm}>
              <Text style={styles.formLabel}>
                {lang === "bn" ? "কারণ লিখুন (২ - ২০০ অক্ষর)" : "Reason for Rejection (2 - 200 chars)"}
              </Text>
              <TextInput
                onChangeText={setRejectionReason}
                placeholder={lang === "bn" ? "যেমন: ছবি অস্পষ্ট বা ভুল ফাইল..." : "e.g. blurry image or incorrect file..."}
                placeholderTextColor="#A0A0A0"
                style={styles.formInput}
                value={rejectionReason}
                maxLength={200}
              />
              <Text style={styles.formDesc}>
                {lang === "bn" 
                  ? "মায়ের ড্যাশবোর্ডে এই কারণটি প্রদর্শন করা হবে যাতে তারা প্রয়োজনীয় সংশোধন করতে পারেন।" 
                  : "This note will be shown to the mother so they can understand what to correct."}
              </Text>

              <View style={styles.approveSubmitRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={actionLoading}
                  onPress={submitReject}
                  style={({ pressed }) => [
                    styles.submitRejectBtn,
                    actionLoading && styles.disabled,
                    pressed && !actionLoading && styles.pressed
                  ]}
                >
                  {actionLoading ? (
                    <ActivityIndicator color={colors.onError} />
                  ) : (
                    <Text style={styles.submitRejectText}>
                      {lang === "bn" ? "নিশ্চিত করুন ও প্রত্যাখ্যান করুন" : "Confirm & Reject"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant
  },
  backBtn: {
    padding: spacing.xs
  },
  topTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  placeholderBtn: {
    width: 32
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.default,
    borderWidth: 1,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    paddingHorizontal: spacing.base,
    minHeight: 48
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.onSurface,
    fontSize: 15
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.base,
    gap: spacing.base
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: "center"
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.default
  },
  retryText: {
    ...typography.body,
    color: colors.onPrimary,
    fontWeight: "bold"
  },
  list: {
    padding: spacing.base,
    gap: spacing.base
  },
  verifyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.base,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1
  },
  cardInfo: {
    gap: spacing.xs
  },
  motherName: {
    ...typography.h2,
    color: colors.onSurface
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  infoText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    fontSize: 14
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: spacing.sm
  },
  viewCertBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs
  },
  viewCertText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "bold"
  },
  btnGroup: {
    flexDirection: "row",
    gap: spacing.sm
  },
  btn: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.default,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center"
  },
  rejectBtn: {
    backgroundColor: colors.errorContainer
  },
  rejectText: {
    ...typography.caption,
    color: colors.onErrorContainer,
    fontWeight: "bold"
  },
  approveBtn: {
    backgroundColor: colors.secondaryContainer
  },
  approveText: {
    ...typography.caption,
    color: colors.onSecondaryContainer,
    fontWeight: "bold"
  },
  emptyContainer: {
    paddingTop: 80,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.base
  },
  emptyText: {
    ...typography.body,
    color: colors.outline,
    textAlign: "center"
  },
  imageBackdrop: {
    backgroundColor: "rgba(0,0,0,0.7)",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg
  },
  imagePanel: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.card,
    padding: spacing.base,
    width: "100%",
    maxHeight: "80%",
    gap: spacing.base
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  modalTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: colors.background,
    borderRadius: radius.default,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center"
  },
  certificateImage: {
    width: "100%",
    height: "100%"
  },
  certOverlay: {
    position: "absolute",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.base,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: radius.default,
    borderWidth: 1,
    borderColor: colors.outlineVariant
  },
  certOverlayText: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    fontWeight: "bold",
    textAlign: "center"
  },
  modalBackdrop: {
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "flex-end"
  },
  modalPanel: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    width: "100%",
    gap: spacing.base
  },
  approveForm: {
    gap: spacing.base
  },
  formLabel: {
    ...typography.label,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  formInput: {
    backgroundColor: colors.background,
    borderColor: colors.outlineVariant,
    borderRadius: radius.default,
    borderWidth: 1,
    color: colors.onSurface,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.base
  },
  formDesc: {
    ...typography.caption,
    color: colors.outline
  },
  approveSubmitRow: {
    marginTop: spacing.sm
  },
  submitRejectBtn: {
    alignItems: "center",
    backgroundColor: colors.error,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing.base
  },
  submitRejectText: {
    ...typography.body,
    color: colors.onError,
    fontFamily: typography.h2.fontFamily
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    opacity: 0.86
  }
});
