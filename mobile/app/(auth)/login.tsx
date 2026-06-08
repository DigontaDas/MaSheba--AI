import { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Keyboard,
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
import { Image } from "expo-image";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Icon, type IconName } from "@/components/ui/Icon";
import { loginAndBootstrap, signUpAndBootstrap, supabase } from "@/auth/supabaseAuth";
import { loginMother, saveUserRole, saveMotherId, type UserRole } from "@/auth/roleSession";
import * as ImagePicker from "expo-image-picker";
import { saveSession } from "@/auth/secureSession";
import { upsertPatients } from "@/db/patients";
import { getDB } from "@/db/database";
import type { Patient } from "@/types/schema";
import { copy } from "@/data/stitchCopy.bn";
import { useLanguage } from "@/context/LanguageContext";
import { colors, radius, spacing, typography } from "@/theme";
import { base64ToBlob } from "@/utils/base64";
import * as Network from "expo-network";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

type LoadingAction = "login" | "demo-chw" | "demo-mother";

type DemoCredential = {
  email: string;
  password: string;
};

// Hardcode real seeded demo credentials as fallback so demo auto-login always
// works even if the EXPO_PUBLIC_* env vars are not loaded in Expo Go.
const DEMO_MOTHER_EMAIL = process.env.EXPO_PUBLIC_DEMO_MOTHER_EMAIL || "mother-rahima@maasheba.local";
const DEMO_MOTHER_PASSWORD = process.env.EXPO_PUBLIC_DEMO_MOTHER_PASSWORD || "Mother_B_demo_password";
const DEMO_CHW_EMAIL = process.env.EXPO_PUBLIC_DEMO_CHW_EMAIL || "chw-a@maasheba.local";
const DEMO_CHW_PASSWORD = process.env.EXPO_PUBLIC_DEMO_CHW_PASSWORD || "CHW_A_demo_password";
const demoCredentials: Record<UserRole, DemoCredential> = {
  CHW: { email: DEMO_CHW_EMAIL, password: DEMO_CHW_PASSWORD },
  MOTHER: { email: DEMO_MOTHER_EMAIL, password: DEMO_MOTHER_PASSWORD }
};

async function seedLocalChwDemoData() {
  await saveSession({
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    chwId: "00000000-0000-0000-0000-0000000000a1"
  });
  await saveUserRole("CHW");

  const demoPatients: Patient[] = [
    {
      id: "11111111-1111-1111-1111-111111111101",
      chw_id: "00000000-0000-0000-0000-0000000000a1",
      name: "আমিনা খাতুন",
      age: 24,
      gestational_age_weeks: 28,
      last_risk_level: "LOW",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "11111111-1111-1111-1111-111111111102",
      chw_id: "00000000-0000-0000-0000-0000000000a1",
      name: "রহিমা বেগম",
      age: 29,
      gestational_age_weeks: 32,
      last_risk_level: "MODERATE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "11111111-1111-1111-1111-111111111103",
      chw_id: "00000000-0000-0000-0000-0000000000a1",
      name: "শারমিন আক্তার",
      age: 21,
      gestational_age_weeks: 20,
      last_risk_level: "LOW",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "11111111-1111-1111-1111-111111111104",
      chw_id: "00000000-0000-0000-0000-0000000000a1",
      name: "নাসিমা বেগম",
      age: 34,
      gestational_age_weeks: 34,
      last_risk_level: "HIGH",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "11111111-1111-1111-1111-111111111105",
      chw_id: "00000000-0000-0000-0000-0000000000a1",
      name: "ফাতেমা আক্তার",
      age: 27,
      gestational_age_weeks: 26,
      last_risk_level: "MODERATE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "11111111-1111-1111-1111-111111111106",
      chw_id: "00000000-0000-0000-0000-0000000000a1",
      name: "জান্নাতুল ফেরদৌস",
      age: 19,
      gestational_age_weeks: 18,
      last_risk_level: "LOW",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  await upsertPatients(demoPatients);

  try {
    const db = await getDB();
    await db.execAsync(`
      DELETE FROM visits WHERE chw_id = '00000000-0000-0000-0000-0000000000a1';
      INSERT OR REPLACE INTO visits (
        id, patient_id, chw_id, bp_systolic, bp_diastolic, weight_kg, hemoglobin, swelling_present, symptom_flags, risk_level, visited_at, device_id, created_at
      ) VALUES (
        'visit-1', '11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-0000000000a1', 140, 95, 62.5, 10.2, 1, '{"headache":true}', 'HIGH', '${new Date().toISOString()}', 'emulator-device', '${new Date().toISOString()}'
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
    chwId: "60000000-0000-0000-0000-000000000002"
  });
  await saveUserRole("MOTHER");
  await saveMotherId("60000000-0000-0000-0000-000000000002");
}

const translations = {
  bn: {
    appName: "মাসেবা AI",
    tagline: "আপনার গর্ভকালীন সঙ্গী",
    motherBtn: "মা হিসেবে চালিয়ে যান  →",
    chwBtn: "স্বাস্থ্যকর্মী হিসেবে চালিয়ে যান",
    whoCompliance: "WHO নির্দেশিকা অনুসরণ করে",
    offlineNotice: "ইন্টারনেট ছাড়াও অফলাইনে কাজ করে",
    loginTab: "লগইন",
    signupTab: "নিবন্ধন",
    namePlaceholder: "আপনার নাম",
    clinicCodePlaceholder: "ক্লিনিক কোড / আইডি",
    gestationalAgePlaceholder: "গর্ভকালীন বয়স (সপ্তাহ)",
    chwModalTitle: "স্বাস্থ্যকর্মী অ্যাকাউন্ট",
    motherModalTitle: "মা এর অ্যাকাউন্ট",
    emailPlaceholder: "ইমেইল বা মোবাইল নম্বর",
    passwordPlaceholder: "পাসওয়ার্ড",
    loginSubmitBtn: "লগইন করুন",
    signupSubmitBtn: "নিবন্ধন করুন",
    demoAutoLoginBtn: "ডেমো অটো-লগইন ⚡",
    closeBtn: "বন্ধ করুন",
    loadingText: "চালু হচ্ছে...",
    signupSuccess: "নিবন্ধন সফল! অনুগ্রহ করে অ্যাকাউন্ট সক্রিয় করতে নির্দেশনা মেনে চলুন।",
    signupSuccessAuto: "নিবন্ধন সফল! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে..."
  },
  en: {
    appName: "MaSheba AI",
    tagline: "Your Pregnancy Companion",
    motherBtn: "Continue as Mother  →",
    chwBtn: "Continue as Health Worker",
    whoCompliance: "Following WHO Guidelines",
    offlineNotice: "Works Offline Without Internet",
    loginTab: "Login",
    signupTab: "Sign Up",
    namePlaceholder: "Your Name",
    clinicCodePlaceholder: "Clinic ID / Code",
    gestationalAgePlaceholder: "Gestational Age (Weeks)",
    chwModalTitle: "Health Worker Account",
    motherModalTitle: "Mother Account",
    emailPlaceholder: "Email or Phone Number",
    passwordPlaceholder: "Password",
    loginSubmitBtn: "Log In",
    signupSubmitBtn: "Sign Up",
    demoAutoLoginBtn: "Demo Auto-Login ⚡",
    closeBtn: "Close",
    loadingText: "Loading...",
    signupSuccess: "Registration successful! Please follow verification instructions to activate your account.",
    signupSuccessAuto: "Registration successful! Redirecting to dashboard..."
  }
};

const DUMMY_CERT_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export default function LoginScreen() {
  const { language: lang, setLanguage } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalRole, setModalRole] = useState<UserRole | null>(null);
  const [modalMode, setModalMode] = useState<"login" | "signup">("login");

  const isKeyboardVisibleRef = useRef(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      isKeyboardVisibleRef.current = true;
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      isKeyboardVisibleRef.current = false;
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  
  // Inputs
  const [name, setName] = useState("");
  const [clinicCode, setClinicCode] = useState("");
  const [gestationalAge, setGestationalAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // CHW Signup inputs
  const [orgName, setOrgName] = useState("");
  const [workerType, setWorkerType] = useState("");
  const [experience, setExperience] = useState("");
  const [workingArea, setWorkingArea] = useState("");
  const [certificateUrlText, setCertificateUrlText] = useState("");
  const [certificateName, setCertificateName] = useState<string | null>(null);
  const [certificateBlob, setCertificateBlob] = useState<Blob | null>(null);
  const [certPickerVisible, setCertPickerVisible] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(null);
  const [heroFailed, setHeroFailed] = useState(false);

  const handleSelectMockCertificate = (type: string) => {
    setError(null);
    try {
      const blob = base64ToBlob(DUMMY_CERT_BASE64, "image/png");
      setCertificateBlob(blob);
      setCertificateName(type);
      setCertPickerVisible(false);
    } catch (err) {
      setError(lang === "bn" ? "সার্টিফিকেট প্রসেস করতে ব্যর্থ হয়েছে" : "Failed to process certificate");
    }
  };

  const handleLaunchCamera = async () => {
    setCertPickerVisible(false);
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
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        setCertificateBlob(blob);
        setCertificateName(asset.fileName || "camera_photo.png");
      }
    } catch (err) {
      setError(lang === "bn" ? "ক্যামেরা খুলতে ব্যর্থ হয়েছে" : "Failed to open camera");
    }
  };

  const handleLaunchImageLibrary = async () => {
    setCertPickerVisible(false);
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        setCertificateBlob(blob);
        setCertificateName(asset.fileName || "library_photo.png");
      }
    } catch (err) {
      setError(lang === "bn" ? "গ্যালারি খুলতে ব্যর্থ হয়েছে" : "Failed to open image library");
    }
  };

  const t = translations[lang];
  const loading = loadingAction !== null;

  useEffect(() => {
    const onBackPress = () => {
      if (isKeyboardVisibleRef.current) {
        Keyboard.dismiss();
        return true;
      }
      if (modalVisible) {
        setModalVisible(false);
        return true;
      }
      BackHandler.exitApp();
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [modalVisible]);

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
    setOrgName("");
    setWorkerType("");
    setExperience("");
    setWorkingArea("");
    setCertificateUrlText("");
    setCertificateName(null);
    setCertificateBlob(null);
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

      if (role === "CHW") {
        const isDemoChwCredentials =
          emailLower === DEMO_CHW_EMAIL.toLowerCase() || action === "demo-chw";
        try {
          await loginAndBootstrap(nextEmail.trim(), nextPassword);
          await saveUserRole("CHW");
          setModalVisible(false);
          router.replace("/(tabs)/home");
        } catch (_bootstrapError) {
          // Only silently fall back to offline demo for the actual demo CHW credentials.
          // Any other failed login (e.g. wrong password, admin creds mis-routed) surfaces an error.
          if (isDemoChwCredentials) {
            await seedLocalChwDemoData();
            setModalVisible(false);
            router.replace("/(tabs)/home");
          } else {
            let msg = "";
            if (_bootstrapError instanceof Error) {
              const errMsg = _bootstrapError.message;
              if (errMsg === "YOUR_REGISTRATION_PENDING") {
                msg = lang === "bn"
                  ? "আপনার অ্যাকাউন্টটি অ্যাডমিন অনুমোদনের জন্য অপেক্ষমাণ রয়েছে। অনুমোদিত না হওয়া পর্যন্ত আপনি লগইন করতে পারবেন না।"
                  : "Your account is pending administrator approval. You cannot log in until approved.";
              } else if (errMsg.startsWith("YOUR_REGISTRATION_DENIED|")) {
                const reason = errMsg.split("|")[1] || "";
                msg = lang === "bn"
                  ? `আপনার অ্যাকাউন্টটি অ্যাডমিন দ্বারা প্রত্যাখ্যাত হয়েছে। কারণ: ${reason || "কোনো কারণ উল্লেখ করা হয়নি।"}`
                  : `Your registration was denied by the administrator. Reason: ${reason || "No reason specified."}`;
              } else if (errMsg === "YOUR_ACCOUNT_INACTIVE") {
                msg = lang === "bn"
                  ? "আপনার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় রয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।"
                  : "Your account is currently inactive. Please contact the administrator.";
              } else {
                msg = errMsg;
              }
            } else {
              msg = lang === "bn" ? "লগইন ব্যর্থ হয়েছে" : "Login failed";
            }
            setError(msg);
          }
        }
        return;
      }

      if (role === "MOTHER") {
        if (action === "demo-mother" || emailLower === DEMO_MOTHER_EMAIL.toLowerCase()) {
          await seedLocalMotherDemoData();
          setModalVisible(false);
          router.replace("/(mother-tabs)/home");
          return;
        }

        try {
          await loginMother(nextEmail.trim(), nextPassword);
          setModalVisible(false);
          router.replace("/(mother-tabs)/home");
        } catch (motherLoginError: any) {
          const errMsg = motherLoginError?.message || "";
          const isDbOrSchemaError = 
            errMsg.includes("verification_status") || 
            errMsg.includes("column") || 
            errMsg.includes("relation") || 
            errMsg.includes("Database") ||
            errMsg.includes("network") || 
            errMsg.includes("fetch") || 
            errMsg.includes("Failed to fetch");

          if (isDbOrSchemaError) {
            await seedLocalMotherDemoData();
            setModalVisible(false);
            router.replace("/(mother-tabs)/home");
          } else {
            throw motherLoginError;
          }
        }
        return;
      }
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
      if (!orgName.trim()) {
        setError(lang === "bn" ? "অনুগ্রহ করে প্রতিষ্ঠানের নাম লিখুন" : "Please enter organization name");
        return;
      }
      if (!workerType.trim()) {
        setError(lang === "bn" ? "অনুগ্রহ করে কর্মী ধরন লিখুন" : "Please enter worker type");
        return;
      }
      if (!workingArea.trim()) {
        setError(lang === "bn" ? "অনুগ্রহ করে কর্ম এলাকা লিখুন" : "Please enter working area");
        return;
      }
      if (!experience.trim()) {
        setError(lang === "bn" ? "অনুগ্রহ করে আপনার অভিজ্ঞতা বছর লিখুন" : "Please enter years of experience");
        return;
      }
      const expYears = parseInt(experience.trim(), 10);
      if (isNaN(expYears) || expYears < 0) {
        setError(lang === "bn" ? "অভিজ্ঞতা অবশ্যই একটি সঠিক সংখ্যা হতে হবে" : "Years of experience must be a valid number");
        return;
      }
      if (!certificateUrlText.trim() && !certificateBlob) {
        setError(
          lang === "bn"
            ? "অনুগ্রহ করে একটি সার্টিফিকেট আপলোড করুন অথবা লিংক প্রদান করুন"
            : "Please upload a certificate or provide a link"
        );
        return;
      }

      extraMetadata.clinic_code = clinicCode.trim();
      extraMetadata.organization_name = orgName.trim();
      extraMetadata.worker_type = workerType.trim();
      extraMetadata.years_of_experience = expYears;
      extraMetadata.working_area = workingArea.trim();
      if (certificateUrlText.trim()) {
        extraMetadata.certificate_url = certificateUrlText.trim();
      }
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
        if (role === "CHW" && certificateBlob) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user?.id) {
              const userId = sessionData.session.user.id;
              const fileExt = certificateName ? certificateName.split('.').pop() : 'png';
              const fileName = `${userId}_${Date.now()}.${fileExt}`;
              
              const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('certificates')
                .upload(fileName, certificateBlob, {
                  contentType: 'image/' + (fileExt === 'jpg' ? 'jpeg' : fileExt),
                  upsert: true
                });
              if (uploadErr) throw uploadErr;

              const { data: urlData } = supabase.storage
                .from('certificates')
                .getPublicUrl(fileName);

              if (urlData?.publicUrl) {
                const { error: dbUpdateErr } = await supabase
                  .from('chws')
                  .update({ certificate_url: urlData.publicUrl })
                  .eq('auth_user_id', userId);
                if (dbUpdateErr) throw dbUpdateErr;
              }
            }
          } catch (uploadError) {
            console.error("Certificate upload failed:", uploadError);
            Alert.alert(
              lang === "bn" ? "সার্টিফিকেট আপলোড ব্যর্থ" : "Certificate Upload Failed",
              lang === "bn" 
                ? "আপনার অ্যাকাউন্ট তৈরি হয়েছে, কিন্তু সার্টিফিকেট আপলোড করা যায়নি।"
                : "Your account was created, but the certificate upload failed."
            );
          }
        }

        if (role === "CHW") {
          await supabase.auth.signOut().catch(() => undefined);
          setError(null);
          const successMsg = lang === "bn"
            ? "আপনার নিবন্ধন অনুরোধটি অ্যাডমিনের কাছে অনুমোদনের জন্য পাঠানো হয়েছে। অনুমোদিত না হওয়া পর্যন্ত আপনি লগইন করতে পারবেন না।"
            : "Your request has been sent to the admin for approval. You cannot log in until approved.";

          Alert.alert(
            lang === "bn" ? "নিবন্ধন সফল" : "Registration Successful",
            successMsg,
            [{ text: lang === "bn" ? "ঠিক আছে" : "OK" }]
          );
          setModalVisible(false);
          return;
        }

        setError(null);
        Alert.alert(
          lang === "bn" ? "নিবন্ধন সফল" : "Registration Successful",
          t.signupSuccessAuto,
          [{ text: lang === "bn" ? "ঠিক আছে" : "OK" }]
        );
        setModalVisible(false);
        router.replace("/(mother-tabs)/home");
      } else {
        setError(null);
        const successMsg = role === "CHW"
          ? (lang === "bn"
              ? "আপনার নিবন্ধন অনুরোধটি অ্যাডমিনের কাছে অনুমোদনের জন্য পাঠানো হয়েছে। অনুমোদিত না হওয়া পর্যন্ত আপনি লগইন করতে পারবেন না।"
              : "Your request has been sent to the admin for approval. You cannot log in until approved.")
          : (lang === "bn" ? t.signupSuccess : t.signupSuccess);

        Alert.alert(
          lang === "bn" ? "নিবন্ধন সফল" : "Registration Successful",
          successMsg,
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

  const handleOfflineRegister = async () => {
    if (modalMode !== "signup") {
      setModalMode("signup");
      Alert.alert(
        lang === "bn" ? "অফলাইন গেস্ট মোড" : "Offline Guest Mode",
        lang === "bn"
          ? "অফলাইনে ব্যবহারের জন্য অনুগ্রহ করে নাম এবং গর্ভকালীন বয়স দিয়ে নিবন্ধন করুন।"
          : "Please enter your name and gestational age to use the app offline."
      );
      return;
    }

    if (!name.trim()) {
      setError(lang === "bn" ? "অনুগ্রহ করে আপনার নাম দিন" : "Please enter your name");
      return;
    }

    if (!gestationalAge.trim()) {
      setError(lang === "bn" ? "অনুগ্রহ করে গর্ভকালীন বয়স দিন" : "Please enter gestational age");
      return;
    }

    const weeks = parseInt(gestationalAge.trim(), 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 45) {
      setError(lang === "bn" ? "গর্ভকালীন বয়স ১ থেকে ৪৫ সপ্তাহের মধ্যে হতে হবে" : "Gestational age must be between 1 and 45 weeks");
      return;
    }

    setLoadingAction("login");
    setError(null);

    try {
      const localId = `offline-mother-${Date.now()}`;
      
      // Calculate LMP Date locally
      const lmpDate = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const localProfile = {
        id: localId,
        name: name.trim(),
        patientId: null,
        phone: email.trim() || null, // store whatever phone/email typed
        gestationalAgeWeeks: weeks,
        verificationStatus: "VERIFIED",
        lmpDate: lmpDate,
        chwEmail: null,
        chwPhone: null,
        rejectionReason: null
      };

      // Save offline credentials if they typed email and password
      if (email.trim() && password.trim()) {
        await SecureStore.setItemAsync(
          `maasheba.offline_creds_email_${localId}`,
          email.trim()
        );
        await SecureStore.setItemAsync(
          `maasheba.offline_creds_password_${localId}`,
          password.trim()
        );
      }

      await AsyncStorage.setItem(`maasheba.offline_profile_${localId}`, JSON.stringify(localProfile));
      
      await saveSession({
        accessToken: "offline-access-token",
        refreshToken: "offline-refresh-token",
        chwId: localId
      });
      await saveUserRole("MOTHER");
      await saveMotherId(localId);

      setModalVisible(false);
      Alert.alert(
        lang === "bn" ? "নিবন্ধন সফল" : "Registration Successful",
        lang === "bn" 
          ? "গেস্ট অফলাইন নিবন্ধন সফল! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে..."
          : "Offline guest registration successful! Redirecting to dashboard...",
        [{ text: lang === "bn" ? "ঠিক আছে" : "OK", onPress: () => router.replace("/(mother-tabs)/home") }]
      );
    } catch (err: any) {
      setError(err?.message || "Offline registration failed");
    } finally {
      setLoadingAction(null);
    }
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
                  source={require("../../assets/images/Login_page_pic.webp")}
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            <ScrollView
              style={styles.modalFormScroll}
              contentContainerStyle={styles.modalFormContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {modalMode === "signup" && (
                <View style={{ gap: 12, marginBottom: 12 }}>
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
                    <>
                      <TextInput
                        onChangeText={setClinicCode}
                        placeholder={t.clinicCodePlaceholder}
                        placeholderTextColor="#A0A0A0"
                        style={styles.modalInput}
                        value={clinicCode}
                      />
                      <TextInput
                        onChangeText={setOrgName}
                        placeholder={lang === "bn" ? "প্রতিষ্ঠানের নাম" : "Organization Name"}
                        placeholderTextColor="#A0A0A0"
                        style={styles.modalInput}
                        value={orgName}
                      />
                      <TextInput
                        onChangeText={setWorkerType}
                        placeholder={lang === "bn" ? "কর্মী ধরন (যেমন: HA, FWA, NGO)" : "Worker Type (e.g. HA, FWA, NGO)"}
                        placeholderTextColor="#A0A0A0"
                        style={styles.modalInput}
                        value={workerType}
                      />
                      <TextInput
                        keyboardType="numeric"
                        onChangeText={setExperience}
                        placeholder={lang === "bn" ? "অভিজ্ঞতা (বছর)" : "Years of Experience"}
                        placeholderTextColor="#A0A0A0"
                        style={styles.modalInput}
                        value={experience}
                      />
                      <TextInput
                        onChangeText={setWorkingArea}
                        placeholder={lang === "bn" ? "কর্ম এলাকা (ইউনিয়ন/উপজেলা)" : "Working Area (Union/Upazila)"}
                        placeholderTextColor="#A0A0A0"
                        style={styles.modalInput}
                        value={workingArea}
                      />
                      
                      {/* Certificate Upload Interface */}
                      <View style={styles.certSection}>
                        <Pressable
                          onPress={() => setCertPickerVisible(true)}
                          style={[styles.uploadBox, certificateBlob && styles.uploadBoxActive]}
                        >
                          <View style={styles.uploadBoxContent}>
                            <Icon name={certificateBlob ? "check-circle" : "cloud-upload"} color={certificateBlob ? "#FFFFFF" : "#4A6047"} size={20} />
                            <Text style={certificateBlob ? styles.uploadTextActive : styles.uploadText}>
                              {certificateBlob
                                ? (lang === "bn" ? `সংযুক্ত: ${certificateName}` : `Attached: ${certificateName}`)
                                : (lang === "bn" ? "সার্টিফিকেট ফাইল আপলোড" : "Upload Certificate")}
                            </Text>
                          </View>
                        </Pressable>

                        <Text style={styles.orDividerText}>
                          {lang === "bn" ? "— অথবা লিংক দিন —" : "— OR PROVIDE LINK —"}
                        </Text>

                        <TextInput
                          onChangeText={setCertificateUrlText}
                          placeholder={lang === "bn" ? "সার্টিফিকেট লিংক (ঐচ্ছিক)" : "Certificate Link (Optional)"}
                          placeholderTextColor="#A0A0A0"
                          style={styles.modalInput}
                          value={certificateUrlText}
                        />
                      </View>
                    </>
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
                </View>
              )}

              {/* Email or Phone Address */}
              <TextInput
                accessibilityLabel="ইমেইল বা মোবাইল"
                autoCapitalize="none"
                keyboardType="default"
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

              {modalRole === "MOTHER" && (
                <Pressable
                  accessibilityLabel="অফলাইন গেস্ট হিসেবে প্রবেশ করুন"
                  onPress={handleOfflineRegister}
                  style={({ pressed }) => [
                    styles.modalSubmitButton,
                    { backgroundColor: "#4A6047", marginTop: 12 },
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={styles.modalSubmitButtonText}>
                    {lang === "bn" ? "অফলাইন গেস্ট হিসেবে প্রবেশ করুন 💾" : "Enter as Offline Guest 💾"}
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Certificate Source Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={certPickerVisible}
        onRequestClose={() => setCertPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCertPickerVisible(false)} />
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {lang === "bn" ? "সার্টিফিকেট ফাইল নির্বাচন করুন" : "Select Certificate File"}
              </Text>
              <Pressable onPress={() => setCertPickerVisible(false)}>
                <Icon name="close" size={24} color="#70605A" />
              </Pressable>
            </View>

            <View style={{ gap: 12, marginTop: 12, paddingBottom: 20 }}>
              <Pressable
                onPress={handleLaunchImageLibrary}
                style={styles.optionRow}
              >
                <Icon name="image" color="#E57A58" size={24} />
                <Text style={styles.optionText}>
                  {lang === "bn" ? "গ্যালারি থেকে ছবি নির্বাচন করুন" : "Choose Photo from Gallery"}
                </Text>
              </Pressable>
              
              <Pressable
                onPress={handleLaunchCamera}
                style={styles.optionRow}
              >
                <Icon name="photo-camera" color="#E57A58" size={24} />
                <Text style={styles.optionText}>
                  {lang === "bn" ? "ক্যামেরা দিয়ে ছবি তুলুন" : "Take Photo with Camera"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleSelectMockCertificate("Demo Certificate (Mock).png")}
                style={styles.optionRow}
              >
                <Icon name="description" color="#E57A58" size={24} />
                <Text style={styles.optionText}>
                  {lang === "bn" ? "ডেমো ডকুমেন্ট যুক্ত করুন (Mock)" : "Use Demo Mock Certificate"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  modalFormScroll: {
    maxHeight: 400
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
  },
  certSection: {
    marginTop: 8,
    gap: 8
  },
  uploadBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EBDCD9",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1.5,
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  uploadBoxActive: {
    backgroundColor: "#E57A58",
    borderColor: "#E57A58",
    borderStyle: "solid"
  },
  uploadBoxContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  uploadText: {
    color: "#4A6047",
    fontSize: 15,
    fontWeight: "600"
  },
  uploadTextActive: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  },
  orDividerText: {
    textAlign: "center",
    color: "#A08E88",
    fontSize: 12,
    marginVertical: 4,
    fontWeight: "bold"
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
