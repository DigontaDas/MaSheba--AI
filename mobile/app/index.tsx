import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { clearRoleSession, saveMotherId, saveUserRole } from "@/auth/roleSession";
import { clearSession, getSession } from "@/auth/secureSession";
import { supabase } from "@/auth/supabaseAuth";
import { colors } from "@/theme";

type ActiveRoleRow = {
  id: string;
  is_active: boolean;
};

async function clearAuthState() {
  await supabase.auth.signOut().catch(() => undefined);
  await Promise.all([clearSession(), clearRoleSession()]);
}

async function routeFromStoredSession() {
  const storedSession = await getSession();
  if (!storedSession) {
    router.replace("/(auth)/login");
    return;
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: storedSession.accessToken,
    refresh_token: storedSession.refreshToken
  });

  if (sessionError) {
    await clearAuthState();
    router.replace("/(auth)/login");
    return;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    await clearAuthState();
    router.replace("/(auth)/login");
    return;
  }

  const { data: chw } = await supabase
    .from("chws")
    .select("id,is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle<ActiveRoleRow>();

  if (chw?.is_active) {
    await saveUserRole("CHW");
    router.replace("/(tabs)/home");
    return;
  }

  const { data: mother } = await supabase
    .from("mothers")
    .select("id,is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle<ActiveRoleRow>();

  if (mother?.is_active) {
    await saveUserRole("MOTHER");
    await saveMotherId(mother.id);
    router.replace("/(mother-tabs)/home");
    return;
  }

  await clearAuthState();
  router.replace("/(auth)/login");
}

export default function IndexRoute() {
  useEffect(() => {
    routeFromStoredSession()
      .catch(() => router.replace("/(auth)/login"));
  }, []);

  return (
    <View style={styles.screen}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center"
  }
});
