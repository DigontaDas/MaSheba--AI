import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Icon } from "@/components/ui/Icon";
import { loginAndBootstrap } from "@/auth/supabaseAuth";
import { loginMother, saveUserRole, type UserRole } from "@/auth/roleSession";
import { copy } from "@/data/stitchCopy.bn";
import { colors, radius, spacing, typography } from "@/theme";

type LoadingAction = "login" | "demo-chw" | "demo-mother";

type DemoCredential = {
  email: string;
  password: string;
};

const demoCredentials: Record<UserRole, DemoCredential> = {
  CHW: {
    email: process.env.EXPO_PUBLIC_DEMO_CHW_EMAIL ?? "",
    password: process.env.EXPO_PUBLIC_DEMO_CHW_PASSWORD ?? ""
  },
  MOTHER: {
    email: process.env.EXPO_PUBLIC_DEMO_MOTHER_EMAIL ?? "",
    password: process.env.EXPO_PUBLIC_DEMO_MOTHER_PASSWORD ?? ""
  }
};

const getLocalizedCopy = (lang: "bn" | "en") => {
  if (lang === "en") {
    return {
      common: {
        appName: "MaaSheba AI",
        back: "Back",
        loading: "Loading..."
      },
      onboarding: {
        tagline: "Your Pregnancy Companion",
        continueAsMother: "Continue as Mother",
        continueAsChw: "Continue as Healthcare Worker",
        whoGuideline: "Following WHO Guidelines"
      },
      login: {
        chwTitle: "Healthcare Worker Login",
        motherTitle: "Mother Login",
        emailPlaceholder: "Email",
        passwordPlaceholder: "Password",
        loginButton: "Login",
        demoChwButton: "Direct Demo as Healthcare Worker",
        demoMotherButton: "Direct Demo as Mother",
        invalid: "Invalid email or password",
        chwAccessDenied: "This account does not have healthcare worker permissions",
        motherAccessDenied: "Mother profile not found for this account",
        networkError: "Please check your internet connection",
        demoNotSet: "Demo credentials not set",
        selectRoleFirst: "Please select your role first"
      }
    };
  }
  return {
    common: {
      appName: "মাশেবা AI",
      back: copy.common.back,
      loading: copy.common.loading
    },
    onboarding: {
      tagline: copy.onboarding.tagline,
      continueAsMother: "মা হিসেবে চালিয়ে যান",
      continueAsChw: "স্বাস্থ্যকর্মী হিসেবে চালিয়ে যান",
      whoGuideline: copy.onboarding.whoGuideline
    },
    login: {
      chwTitle: copy.login.chwTitle,
      motherTitle: copy.login.motherTitle,
      emailPlaceholder: copy.login.emailPlaceholder,
      passwordPlaceholder: copy.login.passwordPlaceholder,
      loginButton: copy.login.loginButton,
      demoChwButton: "স্বাস্থ্যকর্মী হিসেবে সরাসরি ডেমো দেখুন",
      demoMotherButton: "মা হিসেবে সরাসরি ডেমো দেখুন",
      invalid: copy.login.invalid,
      chwAccessDenied: "এই অ্যাকাউন্টে স্বাস্থ্যকর্মীর অনুমতি নেই",
      motherAccessDenied: "এই অ্যাকাউন্টে মায়ের প্রোফাইল পাওয়া যায়নি",
      networkError: "ইন্টারনেট সংযোগ পরীক্ষা করুন",
      demoNotSet: "ডেমো লগইনের তথ্য সেট করা নেই",
      selectRoleFirst: "প্রথমে আপনার ভূমিকা নির্বাচন করুন"
    }
  };
};

export default function LoginScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(null);
  const [language, setLanguage] = useState<"bn" | "en">("bn");

  const loading = loadingAction !== null;
  const localCopy = getLocalizedCopy(language);

  const getLoginErrorMessage = (loginError: unknown) => {
    if (!(loginError instanceof Error)) {
      return localCopy.login.invalid;
    }

    const message = loginError.message.toLowerCase();
    if (message.includes("network") || message.includes("fetch") || message.includes("internet")) {
      return localCopy.login.networkError;
    }
    if (message.includes("chws") || message.includes("active chw")) {
      return localCopy.login.chwAccessDenied;
    }
    if (message.includes("mothers") || message.includes("active mother")) {
      return localCopy.login.motherAccessDenied;
    }
    if (message.includes("credentials") || message.includes("password") || message.includes("sign in")) {
      return localCopy.login.invalid;
    }

    return localCopy.login.invalid;
  };

  const selectRole = (role: UserRole) => {
    const credentials = demoCredentials[role];
    setSelectedRole(role);
    setEmail(credentials.email);
    setPassword(credentials.password);
    setError(null);
  };

  const submitLogin = async (
    role: UserRole,
    nextEmail: string,
    nextPassword: string,
    action: LoadingAction
  ) => {
    if (!nextEmail || !nextPassword) {
      setError(localCopy.login.demoNotSet);
      return;
    }

    setLoadingAction(action);
    setError(null);
    try {
      if (role === "CHW") {
        await loginAndBootstrap(nextEmail.trim(), nextPassword);
        await saveUserRole("CHW");
        router.replace("/(tabs)/patients");
        return;
      }

      await loginMother(nextEmail.trim(), nextPassword);
      router.replace("/(mother-tabs)/home");
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError));
    } finally {
      setLoadingAction(null);
    }
  };

  const submitManualLogin = () => {
    if (!selectedRole) {
      setError(localCopy.login.selectRoleFirst);
      return;
    }
    submitLogin(selectedRole, email, password, "login");
  };

  const submitDemoLogin = (role: UserRole) => {
    const credentials = demoCredentials[role];
    submitLogin(role, credentials.email, credentials.password, role === "CHW" ? "demo-chw" : "demo-mother");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header - High-Resolution Image */}
        <View style={styles.imageHeaderContainer}>
          <Image
            source={require("../../assets/illustrations/screen.png")}
            style={styles.headerImage}
            resizeMode="cover"
          />
        </View>

        {/* Bottom Content Area */}
        <View style={styles.contentContainer}>
          {selectedRole === null ? (
            /* Mockup State - Welcome Screen */
            <>
              {/* App Identity */}
              <View style={styles.identityContainer}>
                <Text style={styles.appName}>{localCopy.common.appName}</Text>
                <Text style={styles.appTagline}>{localCopy.onboarding.tagline}</Text>
              </View>

              {/* Language Selector Selector */}
              <View style={styles.langSelectorContainer}>
                <Pressable
                  onPress={() => setLanguage("bn")}
                  style={[styles.langButton, language === "bn" && styles.langButtonActive]}
                >
                  <Text style={[styles.langButtonText, language === "bn" && styles.langButtonTextActive]}>
                    বাংলা
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setLanguage("en")}
                  style={[
                    styles.langButton,
                    language === "en" && styles.langButtonActive,
                    language !== "en" && styles.langButtonInactiveBorder
                  ]}
                >
                  <Text style={[styles.langButtonText, language === "en" && styles.langButtonTextActive]}>
                    English
                  </Text>
                </Pressable>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {/* Continue as Mother */}
                <Pressable
                  onPress={() => selectRole("MOTHER")}
                  style={({ pressed }) => [styles.motherButton, pressed && styles.pressed]}
                >
                  <Text style={styles.motherButtonText}>{localCopy.onboarding.continueAsMother}</Text>
                  <Icon name="arrow-forward" color="#ffffff" size={22} />
                </Pressable>

                {/* Continue as Healthcare Worker */}
                <Pressable
                  onPress={() => selectRole("CHW")}
                  style={({ pressed }) => [styles.chwButton, pressed && styles.pressed]}
                >
                  <Text style={styles.chwButtonText}>{localCopy.onboarding.continueAsChw}</Text>
                  <Icon name="add-box" color="#4b6546" size={20} />
                </Pressable>
              </View>

              {/* WHO Guidelines Indicator */}
              <View style={styles.whoContainer}>
                <Icon name="verified" color="#4b6546" size={16} />
                <Text style={styles.whoText}>{localCopy.onboarding.whoGuideline}</Text>
              </View>
            </>
          ) : (
            /* Input Form State - Manual & Demo Login options */
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>
                {selectedRole === "CHW" ? localCopy.login.chwTitle : localCopy.login.motherTitle}
              </Text>
              
              <View style={styles.inputGroup}>
                <TextInput
                  autoCapitalize="none"
                  accessibilityLabel={localCopy.login.emailPlaceholder}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder={localCopy.login.emailPlaceholder}
                  placeholderTextColor={colors.outline}
                  style={styles.input}
                  value={email}
                  disabled={loading}
                />
                
                <TextInput
                  accessibilityLabel={localCopy.login.passwordPlaceholder}
                  onChangeText={setPassword}
                  placeholder={localCopy.login.passwordPlaceholder}
                  placeholderTextColor={colors.outline}
                  secureTextEntry
                  style={styles.input}
                  value={password}
                  disabled={loading}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.formActions}>
                {/* Manual Login */}
                <Pressable
                  onPress={submitManualLogin}
                  disabled={loading || !email || !password}
                  style={({ pressed }) => [
                    styles.motherButton,
                    (loading || !email || !password) && styles.disabledButton,
                    pressed && !loading && styles.pressed
                  ]}
                >
                  {loadingAction === "login" ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.motherButtonText}>{localCopy.login.loginButton}</Text>
                      <Icon name="login" color="#ffffff" size={20} />
                    </>
                  )}
                </Pressable>

                {/* Instant Demo Shortcut */}
                <Pressable
                  onPress={() => submitDemoLogin(selectedRole)}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.demoShortcutButton,
                    loading && styles.disabledButton,
                    pressed && !loading && styles.pressed
                  ]}
                >
                  {loadingAction === "demo-chw" || loadingAction === "demo-mother" ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={styles.demoShortcutText}>
                      {selectedRole === "CHW" ? localCopy.login.demoChwButton : localCopy.login.demoMotherButton}
                    </Text>
                  )}
                </Pressable>

                {/* Go Back */}
                <Pressable
                  onPress={() => setSelectedRole(null)}
                  disabled={loading}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                  <Text style={styles.backButtonText}>{localCopy.common.back}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#fff8f7",
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#fff8f7"
  },
  imageHeaderContainer: {
    width: "100%",
    height: 480,
    overflow: "hidden"
  },
  headerImage: {
    width: "100%",
    height: "100%"
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#fff8f7",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40
  },
  identityContainer: {
    alignItems: "center",
    marginBottom: 20
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#e8896a",
    fontFamily: typography.h1.fontFamily,
    letterSpacing: 0.5
  },
  appTagline: {
    fontSize: 16,
    color: "#54433d",
    marginTop: 6,
    fontFamily: typography.body.fontFamily
  },
  langSelectorContainer: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dac1ba",
    borderWidth: 1,
    borderRadius: 24,
    padding: 3,
    marginBottom: 32,
    shadowColor: "#271818",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  langButton: {
    width: 96,
    height: 38,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent"
  },
  langButtonActive: {
    backgroundColor: "#e8896a"
  },
  langButtonInactiveBorder: {
    // Unselected has border style as per mockup
  },
  langButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#54433d",
    fontFamily: typography.body.fontFamily
  },
  langButtonTextActive: {
    color: "#ffffff",
    fontWeight: "bold"
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 36
  },
  motherButton: {
    height: 56,
    backgroundColor: "#e8896a",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#96482e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  motherButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: typography.h2.fontFamily
  },
  chwButton: {
    height: 56,
    backgroundColor: "#ffffff",
    borderColor: "#4b6546",
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#4b6546",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1
  },
  chwButtonText: {
    color: "#4b6546",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: typography.h2.fontFamily
  },
  whoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: "auto"
  },
  whoText: {
    fontSize: 14,
    color: "#4b6546",
    fontWeight: "500",
    fontFamily: typography.caption.fontFamily
  },
  pressed: {
    opacity: 0.85
  },
  /* Form Styling */
  formContainer: {
    width: "100%",
    paddingTop: 10
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#96482e",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: typography.h2.fontFamily
  },
  inputGroup: {
    gap: 14,
    marginBottom: 16
  },
  input: {
    height: 54,
    backgroundColor: "#ffffff",
    borderColor: "#dac1ba",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#271818",
    fontFamily: typography.body.fontFamily
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: typography.label.fontFamily
  },
  formActions: {
    gap: 14
  },
  demoShortcutButton: {
    height: 54,
    backgroundColor: "#ffffff",
    borderColor: "#e8896a",
    borderWidth: 1.2,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  demoShortcutText: {
    color: "#96482e",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: typography.body.fontFamily
  },
  backButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center"
  },
  backButtonText: {
    color: "#87726c",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: typography.body.fontFamily,
    textDecorationLine: "underline"
  },
  disabledButton: {
    opacity: 0.55
  }
});
