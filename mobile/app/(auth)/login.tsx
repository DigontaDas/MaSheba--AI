import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { OfflineBanner } from "@/components/OfflineBanner";
import { loginAndBootstrap } from "@/auth/supabaseAuth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginAndBootstrap(email.trim(), password);
      router.replace("/(tabs)/patients");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <OfflineBanner />
      <View style={styles.content}>
        <Text style={styles.kicker}>MaaSheba AI</Text>
        <Text style={styles.title}>CHW login</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          style={styles.input}
          value={email}
        />
        <TextInput
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          value={password}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={onLogin} disabled={loading || !email || !password}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1
  },
  content: {
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 20
  },
  kicker: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "700"
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
    borderRadius: 6,
    borderWidth: 1,
    color: "#0f172a",
    minHeight: 48,
    paddingHorizontal: 12
  },
  button: {
    alignItems: "center",
    backgroundColor: "#047857",
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 48
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  },
  error: {
    color: "#be123c"
  }
});
