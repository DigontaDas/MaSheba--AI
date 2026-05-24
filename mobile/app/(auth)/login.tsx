import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { router } from "expo-router";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Icon, type IconName } from "@/components/ui/Icon";
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

const roleOptions: Array<{
  role: UserRole;
  title: string;
  subtitle: string;
  accessibilityLabel: string;
  icon: IconName;
}> = [
  {
    role: "CHW",
    title: "স্বাস্থ্যকর্মী",
    subtitle: "মা ও রোগী ব্যবস্থাপনা",
    accessibilityLabel: copy.onboarding.continueAsChw,
    icon: "health-and-safety"
  },
  {
    role: "MOTHER",
    title: "মা",
    subtitle: "নিজের গর্ভকালীন সহায়তা",
    accessibilityLabel: copy.onboarding.continueAsMother,
    icon: "pregnant-woman"
  }
];

export default function LoginScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(null);

  const loading = loadingAction !== null;

  const getLoginErrorMessage = (loginError: unknown) => {
    if (!(loginError instanceof Error)) {
      return copy.login.invalid;
    }

    const message = loginError.message.toLowerCase();
    if (message.includes("network") || message.includes("fetch") || message.includes("internet")) {
      return "ইন্টারনেট সংযোগ পরীক্ষা করুন";
    }
    if (message.includes("chws") || message.includes("active chw")) {
      return "এই অ্যাকাউন্টে স্বাস্থ্যকর্মীর অনুমতি নেই";
    }
    if (message.includes("mothers") || message.includes("active mother")) {
      return "এই অ্যাকাউন্টে মায়ের প্রোফাইল পাওয়া যায়নি";
    }
    if (message.includes("credentials") || message.includes("password") || message.includes("sign in")) {
      return copy.login.invalid;
    }

    return copy.login.invalid;
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
      setError("ডেমো লগইনের তথ্য সেট করা নেই");
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
      setError("প্রথমে আপনার ভূমিকা নির্বাচন করুন");
      return;
    }
    submitLogin(selectedRole, email, password, "login");
  };

  const submitDemoLogin = (role: UserRole) => {
    const credentials = demoCredentials[role];
    selectRole(role);
    submitLogin(role, credentials.email, credentials.password, role === "CHW" ? "demo-chw" : "demo-mother");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <Icon name="favorite" color={colors.onPrimary} size={28} />
          </View>
          <Text style={styles.title}>{copy.common.appName}</Text>
          <Text style={styles.subtitle}>আপনার গর্ভকালীন সঙ্গী</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>আপনি কে?</Text>
          <View style={styles.roleGrid}>
            {roleOptions.map((option) => {
              const selected = selectedRole === option.role;
              return (
                <Pressable
                  accessibilityLabel={option.accessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  disabled={loading}
                  key={option.role}
                  onPress={() => selectRole(option.role)}
                  style={({ pressed }) => [
                    styles.roleCard,
                    selected && styles.roleCardSelected,
                    pressed && !loading && styles.pressed
                  ]}
                >
                  <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
                    <Icon name={option.icon} color={selected ? colors.onPrimary : colors.primary} size={28} />
                  </View>
                  <Text style={styles.roleTitle}>{option.title}</Text>
                  <Text style={styles.roleSubtitle}>{option.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedRole ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {selectedRole === "CHW" ? copy.login.chwTitle : copy.login.motherTitle}
            </Text>
            <TextInput
              autoCapitalize="none"
              accessibilityLabel={copy.login.emailPlaceholder}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder={copy.login.emailPlaceholder}
              placeholderTextColor={colors.outline}
              style={styles.input}
              value={email}
            />
            <TextInput
              accessibilityLabel={copy.login.passwordPlaceholder}
              onChangeText={setPassword}
              placeholder={copy.login.passwordPlaceholder}
              placeholderTextColor={colors.outline}
              secureTextEntry
              style={styles.input}
              value={password}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label={copy.login.loginButton}
              loading={loadingAction === "login"}
              disabled={loading || !email || !password}
              onPress={submitManualLogin}
            />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <View style={styles.demoCard}>
          <View style={styles.demoDivider}>
            <View style={styles.demoLine} />
            <Text style={styles.demoTitle}>ডেমো মোড</Text>
            <View style={styles.demoLine} />
          </View>
          <Text style={styles.demoBody}>বিচারক ও পরীক্ষকদের জন্য প্রস্তুত করা নিরাপদ ডেমো অ্যাকাউন্ট।</Text>
          <View style={styles.demoActions}>
            <SecondaryButton
              label={loadingAction === "demo-chw" ? "ডেমো চালু হচ্ছে..." : "স্বাস্থ্যকর্মী হিসেবে ডেমো দেখুন"}
              disabled={loading}
              onPress={() => submitDemoLogin("CHW")}
            />
            <SecondaryButton
              label={loadingAction === "demo-mother" ? "ডেমো চালু হচ্ছে..." : "মা হিসেবে ডেমো দেখুন"}
              disabled={loading}
              onPress={() => submitDemoLogin("MOTHER")}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Icon name="shield" color={colors.secondary} size={18} />
          <Text style={styles.footerText}>ইন্টারনেট ছাড়াও অফলাইনে কাজ করে</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  header: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.lg
  },
  logo: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 58,
    justifyContent: "center",
    width: 58
  },
  title: {
    ...typography.h1,
    color: colors.onSurface,
    textAlign: "center"
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontFamily: typography.h2.fontFamily
  },
  roleGrid: {
    flexDirection: "row",
    gap: spacing.sm
  },
  roleCard: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 144,
    padding: spacing.md
  },
  roleCardSelected: {
    borderColor: colors.primaryContainer,
    borderWidth: 2
  },
  roleIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  roleIconSelected: {
    backgroundColor: colors.primary
  },
  roleTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontFamily: typography.h2.fontFamily
  },
  roleSubtitle: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  pressed: {
    opacity: 0.86
  },
  form: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.base,
    padding: spacing.cardPadding
  },
  formTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.onSurface,
    minHeight: 52,
    paddingHorizontal: spacing.base
  },
  error: {
    ...typography.label,
    color: colors.error
  },
  demoCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: spacing.base,
    padding: spacing.cardPadding
  },
  demoDivider: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  demoLine: {
    backgroundColor: colors.outlineVariant,
    flex: 1,
    height: 1
  },
  demoTitle: {
    ...typography.body,
    color: colors.primary,
    fontFamily: typography.h2.fontFamily
  },
  demoBody: {
    ...typography.label,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  demoActions: {
    gap: spacing.sm
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    paddingTop: spacing.sm
  },
  footerText: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  }
});
