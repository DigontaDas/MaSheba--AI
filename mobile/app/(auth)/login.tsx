import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Icon } from "@/components/ui/Icon";
import { loginAndBootstrap } from "@/auth/supabaseAuth";
import { loginMother, saveUserRole, type UserRole } from "@/auth/roleSession";
import { copy } from "@/data/stitchCopy.bn";
import { colors, radius, spacing, typography } from "@/theme";

type Step = "role" | "credentials";

export default function LoginScreen() {
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole>("MOTHER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const chooseRole = (nextRole: UserRole) => {
    setRole(nextRole);
    setError(null);
    setStep("credentials");
  };

  const onLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (role === "CHW") {
        await loginAndBootstrap(email.trim(), password);
        await saveUserRole("CHW");
        router.replace("/(tabs)/patients");
        return;
      }

      await loginMother(email.trim(), password);
      router.replace("/(mother-tabs)/home");
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.content}>
        <OfflineBanner />
        <View style={styles.hero}>
          <Image
            source={require("../../assets/stitch/a_high_quality_professional_realistic_photograph_of_a_young_bangladeshi_mother.png")}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.brandMark}>
            <Icon name="favorite" color={colors.primary} size={22} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{copy.common.appName}</Text>
          <Text style={styles.subtitle}>{copy.onboarding.tagline}</Text>
          <View style={styles.languageRow}>
            <Text style={styles.languageActive}>{copy.onboarding.langBn}</Text>
            <Text style={styles.language}>{copy.onboarding.langEn}</Text>
          </View>
        </View>

        {step === "role" ? (
          <View style={styles.actions}>
            <PrimaryButton
              label={copy.onboarding.continueAsMother}
              iconName="arrow-forward"
              onPress={() => chooseRole("MOTHER")}
            />
            <SecondaryButton label={copy.onboarding.continueAsChw} onPress={() => chooseRole("CHW")} />
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.formHeader}>
              <Pressable accessibilityRole="button" onPress={() => setStep("role")} style={styles.backButton}>
                <Icon name="arrow-back" color={colors.primary} size={20} />
              </Pressable>
              <Text style={styles.formTitle}>{role === "CHW" ? copy.login.chwTitle : copy.login.motherTitle}</Text>
            </View>
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
              loading={loading}
              disabled={!email || !password}
              onPress={onLogin}
            />
          </View>
        )}

        <View style={styles.footer}>
          <Icon name="shield" color={colors.secondary} size={18} />
          <Text style={styles.footerText}>{copy.onboarding.whoGuideline}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: "center",
    padding: spacing.marginMobile
  },
  hero: {
    alignSelf: "center",
    aspectRatio: 1,
    borderRadius: radius.xl,
    maxWidth: 300,
    overflow: "hidden",
    width: "86%"
  },
  heroImage: {
    height: "100%",
    width: "100%"
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    bottom: spacing.base,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: spacing.base,
    width: 48
  },
  header: {
    alignItems: "center",
    gap: spacing.sm
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
  languageRow: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs
  },
  languageActive: {
    ...typography.label,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    color: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm
  },
  language: {
    ...typography.label,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm
  },
  actions: {
    gap: spacing.sm
  },
  form: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.base,
    padding: spacing.cardPadding
  },
  formHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  formTitle: {
    ...typography.h2,
    color: colors.onSurface,
    flex: 1
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
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center"
  },
  footerText: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  }
});
