import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/auth/supabaseAuth";
import { getCurrentMotherProfile, saveMotherId } from "@/auth/roleSession";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { colors, radius, spacing, typography } from "@/theme";
import { getLmpDateFromWeeks } from "@/utils/pregnancy";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import { base64ToBlob } from "@/utils/base64";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

const DUMMY_CERT_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";


export default function MotherSetupScreen() {
  const { language: lang } = useLanguage();
  
  const [name, setName] = useState("");
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState("12");
  const [chwEmailOrPhone, setChwEmailOrPhone] = useState("");
  
  const [certificateName, setCertificateName] = useState<string | null>(null);
  const [certificateBlob, setCertificateBlob] = useState<Blob | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to pre-fill name if profile or auth user exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      if (user) {
        setName(user.user_metadata?.name || "");
      } else {
        supabase.auth.getUser().then(({ data: { user: freshUser } }) => {
          if (freshUser) setName(freshUser.user_metadata?.name || "");
        }).catch(() => undefined);
      }
    }).catch(() => undefined);

    getCurrentMotherProfile().then((profile) => {
      if (profile) {
        if (profile.name) setName(profile.name);
        if (profile.gestationalAgeWeeks) setGestationalAgeWeeks(String(profile.gestationalAgeWeeks));
        if (profile.chwEmail) setChwEmailOrPhone(profile.chwEmail);
        else if (profile.chwPhone) setChwEmailOrPhone(profile.chwPhone);
        if (profile.rejectionReason) setRejectionReason(profile.rejectionReason);
      }
    }).catch(() => undefined);
  }, []);


  const handleSelectMockCertificate = (type: string) => {
    setLoading(true);
    setPickerVisible(false);
    try {
      const blob = base64ToBlob(DUMMY_CERT_BASE64, "image/png");
      setCertificateBlob(blob);
      setCertificateName(type);
      setError(null);
    } catch (err) {
      setError(lang === "bn" ? "সার্টিফিকেট প্রসেস করতে ব্যর্থ হয়েছে" : "Failed to process certificate");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchCamera = async () => {
    setPickerVisible(false);
    setError(null);
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          lang === "bn" ? "অনুমতি প্রয়োজন" : "Permission Required",
          lang === "bn" ? "ক্যামেরা ব্যবহারের অনুমতি প্রয়োজন" : "Camera permission is required to take photo"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setLoading(true);
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        setCertificateBlob(blob);
        setCertificateName(asset.fileName || "camera_photo.png");
      }
    } catch (err) {
      setError(lang === "bn" ? "ক্যামেরা খুলতে ব্যর্থ হয়েছে" : "Failed to open camera");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchImageLibrary = async () => {
    setPickerVisible(false);
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setLoading(true);
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        setCertificateBlob(blob);
        setCertificateName(asset.fileName || "library_photo.png");
      }
    } catch (err) {
      setError(lang === "bn" ? "গ্যালারি খুলতে ব্যর্থ হয়েছে" : "Failed to open image library");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(lang === "bn" ? "অনুগ্রহ করে আপনার নাম লিখুন" : "Please enter your name");
      return;
    }
    const weeks = parseInt(gestationalAgeWeeks.trim(), 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 45) {
      setError(lang === "bn" ? "গর্ভকালীন বয়স ১ থেকে ৪৫ সপ্তাহের মধ্যে দিন" : "Gestational weeks must be between 1 and 45");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let user = session?.user;
      if (!user) {
        const { data: { user: freshUser } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        user = freshUser;
      }
      if (!user) throw new Error("Not logged in");

      // 1. Compute lmp_date based on gestational weeks input
      const lmpDate = getLmpDateFromWeeks(weeks);

      const cleanChwVal = chwEmailOrPhone.trim();
      const hasChw = cleanChwVal.length > 0;
      const isEmail = hasChw && cleanChwVal.includes("@");

      // Capture GPS location
      let locationPoint: string | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
          locationPoint = `POINT(${loc.coords.longitude} ${loc.coords.latitude})`;
        } else {
          console.error("GPS location permission denied during mother profile setup.");
        }
      } catch (locErr) {
        console.error("GPS location capture failed during mother profile setup:", locErr);
      }

      // 2. Update the mother's record (verified instantly)
      const { error: dbErr } = await supabase
        .from("mothers")
        .update({
          name: name.trim(),
          chw_email: hasChw && isEmail ? cleanChwVal.toLowerCase() : null,
          chw_phone: hasChw && !isEmail ? cleanChwVal : null,
          lmp_date: lmpDate,
          gestational_age_weeks: weeks,
          verification_status: "VERIFIED",
          location: locationPoint
        })
        .eq("auth_user_id", user.id);

      if (dbErr) throw dbErr;

      // Ensure local session is updated with mother ID
      const { data: motherData } = await supabase
        .from("mothers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (motherData?.id) {
        await saveMotherId(motherData.id);
      }

      Alert.alert(
        lang === "bn" ? "প্রোফাইল সেটআপ সফল" : "Setup Successful",
        lang === "bn" ? "আপনার তথ্য সফলভাবে সংরক্ষিত হয়েছে।" : "Your pregnancy details have been successfully saved.",
        [{ text: lang === "bn" ? "ঠিক আছে" : "OK", onPress: () => router.replace("/(mother-tabs)/home") }]
      );
    } catch (err: any) {
      console.error("Failed to save mother profile setup details:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {lang === "bn" ? "মায়ের প্রোফাইল সেটআপ" : "Maa Profile Setup"}
            </Text>
            <Text style={styles.subtitle}>
              {lang === "bn" ? "গর্ভকালীন সেবা পেতে আপনার তথ্য পূরণ করুন" : "Fill details to activate your pregnancy care account"}
            </Text>
          </View>

          <View style={styles.card}>
            {rejectionReason && (
              <View style={styles.rejectionCard}>
                <View style={styles.rejectionHeader}>
                  <Icon name="error" color={colors.error} size={18} />
                  <Text style={styles.rejectionTitle}>
                    {lang === "bn" ? "প্রত্যাখ্যানের কারণ:" : "Reason for Rejection:"}
                  </Text>
                </View>
                <Text style={styles.rejectionText}>{rejectionReason}</Text>
              </View>
            )}

            {/* Mother Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {lang === "bn" ? "মায়ের নাম" : "Mother's Name"}
              </Text>
              <TextInput
                onChangeText={setName}
                placeholder={lang === "bn" ? "মায়ের নাম লিখুন" : "Enter mother's name"}
                placeholderTextColor="#A0A0A0"
                style={styles.input}
                value={name}
              />
            </View>

            {/* Gestational Age Weeks Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {lang === "bn" ? "গর্ভকালীন বয়স (সপ্তাহে)" : "Gestational Age (in weeks)"}
              </Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setGestationalAgeWeeks}
                placeholder={lang === "bn" ? "যেমন: ১২" : "e.g. 12"}
                placeholderTextColor="#A0A0A0"
                style={styles.input}
                value={gestationalAgeWeeks}
              />
              <Text style={styles.helperText}>
                {lang === "bn" 
                  ? "সপ্তাহ অনুযায়ী আপনার শেষ মাসিকের তারিখ (LMP) স্বয়ংক্রিয়ভাবে গণনা করা হবে।" 
                  : "Last Menstrual Period (LMP) will be computed automatically based on weeks."}
              </Text>
            </View>

            {/* Health Worker Assigned Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {lang === "bn" ? "যাচাইকারী স্বাস্থ্যকর্মীর ইমেইল বা মোবাইল (ঐচ্ছিক)" : "Assigned Health Worker's Email or Phone (Optional)"}
              </Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setChwEmailOrPhone}
                placeholder={lang === "bn" ? "ইমেইল বা মোবাইল নম্বর" : "Email address or phone number"}
                placeholderTextColor="#A0A0A0"
                style={styles.input}
                value={chwEmailOrPhone}
              />
              <Text style={styles.helperText}>
                {lang === "bn" 
                  ? "যে স্বাস্থ্যকর্মী আপনার সার্টিফিকেটটি অনুমোদন করবেন তার যোগাযোগ নম্বর বা ইমেইল লিখুন।" 
                  : "Contact details of the health worker who will verify and approve your profile."}
              </Text>
            </View>

            {/* Certificate upload is not required for Mothers. Managed by CHW. */}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.btnWrapper}>
              <PrimaryButton
                label={lang === "bn" ? "সংরক্ষণ ও জমা দিন" : "Submit for Verification"}
                onPress={handleSubmit}
                loading={loading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Simulated Document Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pickerVisible}
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerVisible(false)} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {lang === "bn" ? "সার্টিফিকেট ফাইল নির্বাচন করুন" : "Select Certificate File"}
              </Text>
              <Pressable onPress={() => setPickerVisible(false)}>
                <Icon name="close" size={24} color={colors.onSurface} />
              </Pressable>
            </View>

            <View style={styles.modalOptions}>
              <OptionRow
                icon="image"
                title={lang === "bn" ? "গ্যালারি থেকে ছবি নির্বাচন করুন" : "Choose Photo from Gallery"}
                onPress={handleLaunchImageLibrary}
              />
              <OptionRow
                icon="photo-camera"
                title={lang === "bn" ? "ক্যামেরা দিয়ে ছবি তুলুন" : "Take Photo with Camera"}
                onPress={handleLaunchCamera}
              />
              <OptionRow
                icon="description"
                title={lang === "bn" ? "ডেমো ডকুমেন্ট যুক্ত করুন (Mock)" : "Use Demo Mock Certificate"}
                onPress={() => handleSelectMockCertificate("Demo Pregnancy Certificate (Mock).png")}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

function OptionRow({
  icon,
  title,
  onPress
}: {
  icon: "description" | "image" | "photo-camera";
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.optionRow}>
      <Icon name={icon} color={colors.primary} size={24} />
      <Text style={styles.optionText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scroll: {
    padding: spacing.base,
    paddingBottom: 40
  },
  header: {
    marginBottom: spacing.lg,
    gap: spacing.xs
  },
  title: {
    ...typography.h1,
    color: colors.primary
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.cardPadding,
    gap: spacing.base
  },
  rejectionCard: {
    backgroundColor: colors.errorContainer + "20",
    borderColor: colors.error,
    borderRadius: radius.default,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.xs
  },
  rejectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  rejectionTitle: {
    ...typography.body,
    color: colors.error,
    fontWeight: "bold",
    fontFamily: typography.h2.fontFamily
  },
  rejectionText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    fontSize: 14
  },
  inputGroup: {
    gap: spacing.xs
  },
  label: {
    ...typography.label,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.outlineVariant,
    borderRadius: radius.default,
    borderWidth: 1,
    color: colors.onSurface,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.base
  },
  helperText: {
    ...typography.caption,
    color: colors.outline
  },
  uploadBox: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderStyle: "dashed",
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 140,
    padding: spacing.base
  },
  uploadBoxActive: {
    backgroundColor: colors.secondaryContainer,
    borderStyle: "solid",
    borderColor: colors.secondary
  },
  uploadBoxContent: {
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "center"
  },
  uploadText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "bold"
  },
  uploadTextActive: {
    ...typography.body,
    color: colors.onSecondaryContainer,
    fontWeight: "bold"
  },
  uploadSubtext: {
    ...typography.caption,
    color: colors.outline
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: "bold",
    textAlign: "center"
  },
  btnWrapper: {
    marginTop: spacing.sm
  },
  modalBackdrop: {
    alignItems: "center",
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  modalTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  modalOptions: {
    gap: spacing.xs
  },
  optionRow: {
    alignItems: "center",
    borderBottomColor: colors.outlineVariant,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.base,
    minHeight: 56,
    paddingHorizontal: spacing.sm
  },
  optionText: {
    ...typography.body,
    color: colors.onSurface
  }
});
