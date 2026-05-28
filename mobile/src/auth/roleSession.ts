import * as SecureStore from "expo-secure-store";
import { saveSession, getSession } from "./secureSession";
import { supabase } from "./supabaseAuth";

const USER_ROLE_KEY = "maasheba.user_role";
const MOTHER_ID_KEY = "maasheba.mother_id";

export type UserRole = "CHW" | "MOTHER" | "ADMIN";

type MotherRow = {
  id: string;
  name: string;
  patient_id: string | null;
  phone: string | null;
  gestational_age_weeks: number | null;
  is_active: boolean;
};

export type MotherProfile = {
  id: string;
  name: string;
  patientId: string | null;
  phone: string | null;
  gestationalAgeWeeks: number | null;
};

export async function saveUserRole(role: UserRole): Promise<void> {
  await SecureStore.setItemAsync(USER_ROLE_KEY, role);
}

export async function getUserRole(): Promise<UserRole | null> {
  const role = await SecureStore.getItemAsync(USER_ROLE_KEY);
  return role === "CHW" || role === "MOTHER" || role === "ADMIN" ? role as UserRole : null;
}

export async function saveMotherId(motherId: string): Promise<void> {
  await SecureStore.setItemAsync(MOTHER_ID_KEY, motherId);
}

export async function getMotherId(): Promise<string | null> {
  return SecureStore.getItemAsync(MOTHER_ID_KEY);
}

export async function clearRoleSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(USER_ROLE_KEY),
    SecureStore.deleteItemAsync(MOTHER_ID_KEY)
  ]);
}

export async function loginMother(email: string, password: string): Promise<MotherProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(error?.message ?? "Unable to sign in");
  }

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });

  const { data: mother, error: motherError } = await supabase
    .from("mothers")
    .select("id,name,patient_id,phone,gestational_age_weeks,is_active")
    .eq("auth_user_id", data.session.user.id)
    .single<MotherRow>();

  if (motherError || !mother?.is_active) {
    throw new Error(motherError?.message ?? "Authenticated user is not an active mother");
  }

  await saveSession({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    chwId: mother.id
  });
  await saveUserRole("MOTHER");
  await saveMotherId(mother.id);

  return {
    id: mother.id,
    name: mother.name,
    patientId: mother.patient_id,
    phone: mother.phone,
    gestationalAgeWeeks: mother.gestational_age_weeks
  };
}

export async function getCurrentMotherProfile(): Promise<MotherProfile | null> {
  const motherId = await getMotherId();
  if (!motherId) {
    return null;
  }

  const { data: mother, error } = await supabase
    .from("mothers")
    .select("id,name,patient_id,phone,gestational_age_weeks,is_active")
    .eq("id", motherId)
    .maybeSingle<MotherRow>();

  if (error || !mother?.is_active) {
    return null;
  }

  return {
    id: mother.id,
    name: mother.name,
    patientId: mother.patient_id,
    phone: mother.phone,
    gestationalAgeWeeks: mother.gestational_age_weeks
  };
}

export async function resolveStoredRole(): Promise<UserRole | null> {
  const storedRole = await getUserRole();
  if (storedRole) {
    return storedRole;
  }

  const session = await getSession();
  if (!session) {
    return null;
  }

  await supabase.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken
  });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: chw } = await supabase
    .from("chws")
    .select("id,is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ id: string; is_active: boolean }>();

  if (chw?.is_active) {
    await saveUserRole("CHW");
    return "CHW";
  }

  const { data: mother } = await supabase
    .from("mothers")
    .select("id,is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle<{ id: string; is_active: boolean }>();

  if (mother?.is_active) {
    await saveUserRole("MOTHER");
    await saveMotherId(mother.id);
    return "MOTHER";
  }

  return null;
}
