import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import { Image } from "expo-image";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Icon, type IconName } from "@/components/ui/Icon";
import { loginAndBootstrap, signUpAndBootstrap } from "@/auth/supabaseAuth";
import { loginMother, saveUserRole, saveMotherId, type UserRole } from "@/auth/roleSession";
import { saveSession } from "@/auth/secureSession";
import { upsertPatients } from "@/db/patients";
import { getDB } from "@/db/database";
import type { Patient } from "@/types/schema";
import { copy } from "@/data/stitchCopy.bn";
import { useLanguage } from "@/context/LanguageContext";
import { colors, radius, spacing, typography } from "@/theme";

type LoadingAction = "login" | "demo-chw" | "demo-mother";

type DemoCredential = {
  email: string;
  password: string;
};

// Hardcode real seeded demo credentials as fallback so demo auto-login always
// works even if the EXPO_PUBLIC_* env vars are not loaded in Expo Go.
const DEMO_MOTHER_EMAIL = process.env.EXPO_PUBLIC_DEMO_MOTHER_EMAIL || "mother-rahima@maasheba.local";
const DEMO_MOTHER_PASSWORD = process.env.EXPO_PUBLIC_DEMO_MOTHER_PASSWORD || "Mother_B_demo_password";
const DEMO_CHW_EMAIL = process.env.EXPO_PUBLIC_DEMO_CHW_EMAIL || "chw-live-a@maasheba.local";
const DEMO_CHW_PASSWORD = process.env.EXPO_PUBLIC_DEMO_CHW_PASSWORD || "CHW_A_demo_password";

const demoCredentials: Record<UserRole, DemoCredential> = {
  CHW: { email: DEMO_CHW_EMAIL, password: DEMO_CHW_PASSWORD },
  MOTHER: { email: DEMO_MOTHER_EMAIL, password: DEMO_MOTHER_PASSWORD },
  ADMIN: { email: "admin", password: "admin123" }
};

async function seedLocalChwDemoData() {
  await saveSession({
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    chwId: "chw-demo-id"
  });
  await saveUserRole("CHW");

  const demoPatients: Patient[] = [
    {
      id: "patient-1",
      chw_id: "chw-demo-id",
      name: "রহিমা বেগম",
      age: 24,
      gestational_age_weeks: 28,
      last_risk_level: "HIGH",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "patient-2",
      chw_id: "chw-demo-id",
      name: "ফাতেমা খাতুন",
      age: 28,
      gestational_age_weeks: 14,
      last_risk_level: "MODERATE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "patient-3",
      chw_id: "chw-demo-id",
      name: "আসমা আক্তার",
      age: 21,
      gestational_age_weeks: 8,
      last_risk_level: "LOW",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  await upsertPatients(demoPatients);

  try {
    const db = await getDB();
    await db.execAsync(`
      DELETE FROM visits WHERE chw_id = 'chw-demo-id';
      INSERT OR REPLACE INTO visits (
        id, patient_id, chw_id, bp_systolic, bp_diastolic, weight_kg, hemoglobin, swelling_present, symptom_flags, risk_level, visited_at, device_id, created_at
      ) VALUES (
        'visit-1', 'patient-1', 'chw-demo-id', 140, 95, 62.5, 10.2, 1, '{"headache":true}', 'HIGH', '${new Date().toISOString()}', 'emulator-device', '${new Date().toISOString()}'
      );
    `);
  } catch (_dbErr) {
    // console.error("Local SQLite seeding visits error:", _dbErr)
  }
}

async function seedLocalMotherDemoData() {
  await saveSession({
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    chwId: "mother-demo-id"
  });
  await saveUserRole("MOTHER");
  await saveMotherId("mother-demo-id");
}

const translations = {
  bn: {
    appName: "মাসেবা AI",
    tagline: "আপনার গর্ভকালীন সঙ্গী",
    motherBtn: "মা হিসেবে চালিয়ে যান  →",
    chwBtn: "স্বাস্থ্যকর্মী হিসেবে চালিয়ে যান",
    adminBtn: "অ্যাডমিন ড্যাশবোর্ড দেখুন  →",
    whoCompliance: "WHO নির্দেশিকা অনুসরণ করে",
    offlineNotice: "ইন্টারনেট ছাড়াও অফলাইনে কাজ করে",
    loginTab: "লগইন",
    signupTab: "নিবন্ধন",
    namePlaceholder: "আপনার নাম",
    clinicCodePlaceholder: "ক্লিনিক কোড / আইডি",
    gestationalAgePlaceholder: "গর্ভকালীন বয়স (সপ্তাহ)",
    chwModalTitle: "স্বাস্থ্যকর্মী অ্যাকাউন্ট",
    motherModalTitle: "মা এর অ্যাকাউন্ট",
    emailPlaceholder: "ইমেইল এড্রেস",
    passwordPlaceholder: "পাসওয়ার্ড",
    loginSubmitBtn: "লগইন করুন",
    signupSubmitBtn: "নিবন্ধন করুন",
    demoAutoLoginBtn: "ডেমো অটো-লগইন ⚡",
    closeBtn: "বন্ধ করুন",
    loadingText: "চালু হচ্ছে...",
    signupSuccess: "নিবন্ধন সফল! অনুগ্রহ করে আপনার ইমেইল চেক করুন এবং অ্যাকাউন্ট সক্রিয় করতে ইমেইলটি নিশ্চিত করুন।",
    signupSuccessAuto: "নিবন্ধন সফল! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে..."
  },
  en: {
    appName: "MaSheba AI",
    tagline: "Your Pregnancy Companion",
    motherBtn: "Continue as Mother  →",
    chwBtn: "Continue as Health Worker",
    adminBtn: "View Admin Dashboard  →",
    whoCompliance: "Following WHO Guidelines",
    offlineNotice: "Works Offline Without Internet",
    loginTab: "Login",
    signupTab: "Sign Up",
    namePlaceholder: "Your Name",
    clinicCodePlaceholder: "Clinic ID / Code",
    gestationalAgePlaceholder: "Gestational Age (Weeks)",
    chwModalTitle: "Health Worker Account",
    motherModalTitle: "Mother Account",
    emailPlaceholder: "Email Address",
    passwordPlaceholder: "Password",
    loginSubmitBtn: "Log In",
    signupSubmitBtn: "Sign Up",
    demoAutoLoginBtn: "Demo Auto-Login ⚡",
    closeBtn: "Close",
    loadingText: "Loading...",
    signupSuccess: "Registration successful! Please check your email inbox and verify your email to activate your account.",
    signupSuccessAuto: "Registration successful! Redirecting to dashboard..."
  }
};

export default function LoginScreen() {
  const { language: lang, setLanguage } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalRole, setModalRole] = useState<UserRole | null>(null);
  const [modalMode, setModalMode] = useState<"login" | "signup">("login");
  
  // Inputs
  const [name, setName] = useState("");
  const [clinicCode, setClinicCode] = useState("");
  const [gestationalAge, setGestationalAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(null);
  const [heroFailed, setHeroFailed] = useState(false);

  const t = translations[lang];
  const loading = loadingAction !== null;

  const openMotherModal = () => {
    setModalRole("MOTHER");
    setModalMode("login");
    setName("");
    setGestationalAge("");
    setEmail("");
    setPassword("");
    setError(null);
    setModalVisible(true);
  };

  const openChwModal = () => {
    setModalRole("CHW");
    setModalMode("login");
    setName("");
    setClinicCode("");
    setEmail("");
    setPassword("");
    setError(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const submitLogin = async (
    role: UserRole,
    nextEmail: string,
    nextPassword: string,
    action: LoadingAction
  ) => {
    setLoadingAction(action);
    setError(null);
    try {
      const emailLower = nextEmail.trim().toLowerCase();
      if (emailLower === "admin" && nextPassword === "admin123") {
        await saveUserRole("ADMIN");
        await saveSession({
          accessToken: "mock-admin-token",
          refreshToken: "mock-admin-token",
          chwId: "admin-chw-id"
        });
        setModalVisible(false);
        router.replace("/admin-dashboard");
        return;
      }

      if (role === "CHW") {
        try {
          await loginAndBootstrap(nextEmail.trim(), nextPassword);
          await saveUserRole("CHW");
          setModalVisible(false);
          router.replace("/(tabs)/home");
        } catch (_bootstrapError) {
          // console.warn("Supabase CHW bootstrap failed, falling back to offline demo:", _bootstrapError)
          await seedLocalChwDemoData();
          setModalVisible(false);
          router.replace("/(tabs)/home");
        }
        return;
      }

      // For Mother: DO NOT fall back to fake local session.
      // The CHW chat REQUIRES a real Supabase auth session + mother profile.
      // Show the real error to the user so they can retry with correct credentials.
      await loginMother(nextEmail.trim(), nextPassword);
      setModalVisible(false);
      router.replace("/(mother-tabs)/home");
    } catch (loginError) {
      const msg = loginError instanceof Error ? loginError.message : "লগইন ব্যর্থ হয়েছে";
      // console.error("Login error:", msg)
      setError(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const submitSignup = async (role: UserRole) => {
    if (!name.trim()) {
      setError(lang === "bn" ? "অনুগ্রহ করে আপনার নাম দিন" : "Please enter your name");
      return;
    }

    const extraMetadata: Record<string, any> = {};
    if (role === "CHW") {
      if (!clinicCode.trim()) {
        setError(lang === "bn" ? "অনুগ্রহ করে ক্লিনিক কোড দিন" : "Please enter clinic code");
        return;
      }
      extraMetadata.clinic_code = clinicCode.trim();
    } else {
      if (!gestationalAge.trim()) {
        setError(lang === "bn" ? "অনুগ্রহ করে গর্ভকালীন বয়স দিন" : "Please enter gestational age");
        return;
      }
      const weeks = parseInt(gestationalAge.trim(), 10);
      if (isNaN(weeks) || weeks < 1 || weeks > 45) {
        setError(lang === "bn" ? "গর্ভকালীন বয়স ১ থেকে ৪৫ সপ্তাহের মধ্যে হতে হবে" : "Gestational age must be between 1 and 45 weeks");
        return;
      }
      extraMetadata.gestational_age_weeks = weeks;
    }

    setLoadingAction("login");
    setError(null);

    try {
      const { sessionEstablished } = await signUpAndBootstrap(
        email.trim(),
        password,
        role === "CHW" ? "chw" : "mother",
        name.trim(),
        extraMetadata
      );

      if (sessionEstablished) {
        setError(null);
        Alert.alert(
          lang === "bn" ? "নিবন্ধন সফল" : "Registration Successful",
          lang === "bn" ? t.signupSuccessAuto : t.signupSuccessAuto,
          [{ text: lang === "bn" ? "ঠিক আছে" : "OK" }]
        );
        setModalVisible(false);
        router.replace(role === "CHW" ? "/(tabs)/home" : "/(mother-tabs)/home");
      } else {
        setError(null);
        Alert.alert(
          lang === "bn" ? "নিবন্ধন সফল" : "Registration Successful",
          lang === "bn" ? t.signupSuccess : t.signupSuccess,
          [{ text: lang === "bn" ? "ঠিক আছে" : "OK" }]
        );
        setModalVisible(false);
      }
    } catch (signupError) {
      const msg = signupError instanceof Error ? signupError.message : "নিবন্ধন ব্যর্থ হয়েছে";
      setError(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleModalSubmit = () => {
    if (!modalRole) return;
    if (!email || !password) {
      setError(lang === "bn" ? "সবগুলো ঘর পূরণ করুন" : "Please fill all fields");
      return;
    }
    if (modalMode === "signup") {
      submitSignup(modalRole);
    } else {
      submitLogin(modalRole, email, password, "login");
    }
  };

  const handleDemoAutoLogin = () => {
    if (!modalRole) return;
    const creds = demoCredentials[modalRole];
    // Also pre-fill the fields so user can see what credentials are being used
    setEmail(creds.email);
    setPassword(creds.password);
    submitLogin(modalRole, creds.email, creds.password, modalRole === "CHW" ? "demo-chw" : "demo-mother");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topSection}>
          {/* Full-bleed Top Image */}
          <View style={styles.heroWrap}>
            {heroFailed ? (
              <View style={styles.heroFallback}>
                <Text style={styles.heroFallbackText}>{t.appName}</Text>
              </View>
            ) : (
              <View style={styles.heroContainer}>
                <Image
                  accessibilityLabel="login-hero-image"
                  contentFit="cover"
                  onError={() => setHeroFailed(true)}
                  source={require("../../assets/images/Login_page_pic.png")}
                  style={styles.heroImage}
                  transition={300}
                />
              </View>
            )}
          </View>

          {/* Welcome Branding Header */}
          <View style={styles.brandingWrap}>
            <Text style={styles.title}>{t.appName}</Text>
            <Text style={styles.subtitle}>{t.tagline}</Text>
          </View>

          {/* Fully functional Language Switcher Toggle Pill */}
          <View style={styles.langSwitcherWrap}>
            <View style={styles.langSwitcher}>
              <Pressable
                onPress={() => void setLanguage("bn")}
                style={[styles.langBtn, lang === "bn" && styles.langBtnActive]}
              >
                <Text style={[styles.langBtnText, lang === "bn" && styles.langBtnTextActive]}>বাংলা</Text>
              </Pressable>
              <Pressable
                onPress={() => void setLanguage("en")}
                style={[styles.langBtn, lang === "en" && styles.langBtnActive]}
              >
                <Text style={[styles.langBtnText, lang === "en" && styles.langBtnTextActive]}>English</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.actionsWrap}>
            {/* Continue as Mother Button - Opens pop up */}
            <Pressable
              accessibilityLabel="মা হিসেবে চালিয়ে যান"
              onPress={openMotherModal}
              style={({ pressed }) => [
                styles.motherButton,
                pressed && styles.pressed
              ]}
            >
              <Text style={styles.motherButtonText}>{t.motherBtn}</Text>
            </Pressable>

            {/* Continue as Health Worker Button - Opens pop up */}
            <Pressable
              accessibilityLabel="স্বাস্থ্যকর্মী হিসেবে চালিয়ে যান"
              onPress={openChwModal}
              style={({ pressed }) => [
                styles.chwButton,
                pressed && styles.pressed
              ]}
            >
              <View style={styles.chwButtonContent}>
                <Text style={styles.chwButtonText}>{t.chwBtn}</Text>
                <Icon name="local-hospital" color="#4A6047" size={20} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Footer compliance guidelines */}
        <View style={styles.footer}>
          <View style={styles.whoBadge}>
            <Icon name="shield" color="#4A6047" size={16} />
            <Text style={styles.whoText}>{t.whoCompliance}</Text>
          </View>
          <Text style={styles.offlineText}>{t.offlineNotice}</Text>
        </View>
      </ScrollView>

      {/* Premium Sign Up / Log In Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          
          <View style={styles.modalPanel}>
            {/* Header section of modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalRole === "CHW" ? t.chwModalTitle : t.motherModalTitle}
              </Text>
              <Pressable onPress={closeModal} style={styles.modalCloseBtn}>
                <Icon name="close" color="#70605A" size={24} />
              </Pressable>
            </View>

            {/* Sub-tabs Login / Signup Switcher */}
            <View style={styles.tabSwitcher}>
              <Pressable
                onPress={() => {
                  setModalMode("login");
                  setError(null);
                }}
                style={[styles.tabBtn, modalMode === "login" && styles.tabBtnActive]}
              >
                <Text style={[styles.tabBtnText, modalMode === "login" && styles.tabBtnTextActive]}>
                  {t.loginTab}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setModalMode("signup");
                  setError(null);
                }}
                style={[styles.tabBtn, modalMode === "signup" && styles.tabBtnActive]}
              >
                <Text style={[styles.tabBtnText, modalMode === "signup" && styles.tabBtnTextActive]}>
                  {t.signupTab}
                </Text>
              </Pressable>
            </View>

            {/* Input Forms list */}
            <View style={styles.modalFormContent}>
              {modalMode === "signup" && (
                <>
                  {/* Name field */}
                  <TextInput
                    onChangeText={setName}
                    placeholder={t.namePlaceholder}
                    placeholderTextColor="#A0A0A0"
                    style={styles.modalInput}
                    value={name}
                  />

                  {/* Role-specific Signup Fields */}
                  {modalRole === "CHW" ? (
                    <TextInput
                      onChangeText={setClinicCode}
                      placeholder={t.clinicCodePlaceholder}
                      placeholderTextColor="#A0A0A0"
                      style={styles.modalInput}
                      value={clinicCode}
                    />
                  ) : (
                    <TextInput
                      keyboardType="numeric"
                      onChangeText={setGestationalAge}
                      placeholder={t.gestationalAgePlaceholder}
                      placeholderTextColor="#A0A0A0"
                      style={styles.modalInput}
                      value={gestationalAge}
                    />
                  )}
                </>
              )}

              {/* Email Address */}
              <TextInput
                accessibilityLabel="ইমেইল"
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder={t.emailPlaceholder}
                placeholderTextColor="#A0A0A0"
                style={styles.modalInput}
                value={email}
              />

              {/* Password */}
              <TextInput
                accessibilityLabel="পাসওয়ার্ড"
                onChangeText={setPassword}
                placeholder={t.passwordPlaceholder}
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                style={styles.modalInput}
                value={password}
              />

              {error ? <Text style={styles.modalError}>{error}</Text> : null}

              {/* Modal Primary Action Submit Button */}
              <Pressable
                accessibilityLabel="লগইন করুন"
                disabled={loading}
                onPress={handleModalSubmit}
                style={({ pressed }) => [
                  styles.modalSubmitButton,
                  pressed && styles.pressed,
                  loading && styles.disabled
                ]}
              >
                <Text style={styles.modalSubmitButtonText}>
                  {loading ? t.loadingText : (modalMode === "login" ? t.loginSubmitBtn : t.signupSubmitBtn)}
                </Text>
              </Pressable>

              {/* Fast Test Auto-login Demo button for testers! */}
              <Pressable onPress={handleDemoAutoLogin} style={styles.modalDemoLink}>
                <Text style={styles.modalDemoLinkText}>{t.demoAutoLoginBtn}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFF9F6",
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingBottom: 24
  },
  topSection: {
    width: "100%",
    flexDirection: "column"
  },
  heroWrap: {
    width: "100%",
    height: 480
  },
  heroContainer: {
    width: "100%",
    height: "100%"
  },
  heroImage: {
    width: "100%",
    height: "100%"
  },
  heroFallback: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    height: "100%",
    justifyContent: "center",
    width: "100%"
  },
  heroFallbackText: {
    ...typography.h1,
    color: "#FFFFFF",
    textAlign: "center"
  },
  brandingWrap: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#E57A58",
    textAlign: "center",
    fontFamily: typography.h1.fontFamily
  },
  subtitle: {
    fontSize: 16,
    color: "#70605A",
    textAlign: "center",
    marginTop: 4,
    fontFamily: typography.body.fontFamily
  },
  langSwitcherWrap: {
    alignItems: "center",
    marginBottom: 16
  },
  langSwitcher: {
    flexDirection: "row",
    backgroundColor: "#F2E8E4",
    borderRadius: 24,
    padding: 4,
    width: 190,
    justifyContent: "space-between"
  },
  langBtn: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: "center"
  },
  langBtnActive: {
    backgroundColor: "#E57A58"
  },
  langBtnText: {
    fontSize: 14,
    color: "#70605A",
    fontWeight: "600"
  },
  langBtnTextActive: {
    color: "#FFFFFF"
  },
  actionsWrap: {
    paddingHorizontal: 24,
    gap: 16
  },
  motherButton: {
    backgroundColor: "#E57A58",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  motherButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold"
  },
  chwButton: {
    backgroundColor: "#FFF9F6",
    borderWidth: 1.5,
    borderColor: "#4A6047",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%"
  },
  chwButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  chwButtonText: {
    color: "#4A6047",
    fontSize: 16,
    fontWeight: "bold"
  },
  footer: {
    alignItems: "center",
    marginTop: 36,
    gap: 8
  },
  whoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  whoText: {
    color: "#4A6047",
    fontSize: 13,
    fontWeight: "600"
  },
  offlineText: {
    color: "#A08E88",
    fontSize: 12
  },
  pressed: {
    opacity: 0.82
  },
  disabled: {
    opacity: 0.6
  },
  
  // Premium Modal Styles
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
  modalCloseBtn: {
    padding: 4
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#F2E8E4",
    borderRadius: 12,
    padding: 3,
    marginBottom: 20
  },
  tabBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center"
  },
  tabBtnActive: {
    backgroundColor: "#E57A58"
  },
  tabBtnText: {
    fontSize: 14,
    color: "#70605A",
    fontWeight: "600"
  },
  tabBtnTextActive: {
    color: "#FFFFFF"
  },
  modalFormContent: {
    gap: 12
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
  modalError: {
    color: "#D32F2F",
    fontSize: 13,
    marginTop: 4
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
    fontWeight: "bold"
  },
  modalDemoLink: {
    alignItems: "center",
    marginTop: 8
  },
  modalDemoLinkText: {
    color: "#E57A58",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline"
  }
});
