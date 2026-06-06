import * as SecureStore from "expo-secure-store";
import { saveSession, getSession } from "./secureSession";
import { supabase, normalizePhone } from "./supabaseAuth";

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
  verification_status: string;
  lmp_date: string | null;
  chw_email: string | null;
  chw_phone: string | null;
  rejection_reason: string | null;
};

export type MotherProfile = {
  id: string;
  name: string;
  patientId: string | null;
  phone: string | null;
  gestationalAgeWeeks: number | null;
  verificationStatus: string;
  lmpDate: string | null;
  chwEmail: string | null;
  chwPhone: string | null;
  rejectionReason: string | null;
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

export async function loginMother(identifier: string, password: string): Promise<MotherProfile> {
  const isEmail = identifier.includes("@");
  let credentials;
  
  if (isEmail) {
    credentials = { email: identifier.trim().toLowerCase(), password };
  } else {
    credentials = { phone: normalizePhone(identifier), password };
  }

  let sessionData;
  try {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error || !data.session) {
      if (!isEmail) {
        // Fallback email
        const fallbackEmail = `${normalizePhone(identifier).replace("+", "")}@maasheba.phone`;
        const { data: fbData, error: fbError } = await supabase.auth.signInWithPassword({
          email: fallbackEmail,
          password
        });
        if (fbError || !fbData.session) {
          throw new Error(fbError?.message ?? "Unable to sign in");
        }
        sessionData = fbData;
      } else {
        throw new Error(error?.message ?? "Unable to sign in");
      }
    } else {
      sessionData = data;
    }
  } catch (err: any) {
    if (isEmail) {
      throw err;
    }
    const fallbackEmail = `${normalizePhone(identifier).replace("+", "")}@maasheba.phone`;
    const { data: fbData, error: fbError } = await supabase.auth.signInWithPassword({
      email: fallbackEmail,
      password
    });
    if (fbError || !fbData.session) {
      throw new Error(fbError?.message ?? err.message ?? "Unable to sign in");
    }
    sessionData = fbData;
  }

  const data = sessionData;
  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });

  const { data: mother, error: motherError } = await supabase
    .from("mothers")
    .select("id,name,patient_id,phone,gestational_age_weeks,is_active,verification_status,lmp_date,chw_email,chw_phone,rejection_reason")
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
    gestationalAgeWeeks: mother.gestational_age_weeks,
    verificationStatus: mother.verification_status || "PENDING",
    lmpDate: mother.lmp_date,
    chwEmail: mother.chw_email,
    chwPhone: mother.chw_phone,
    rejectionReason: mother.rejection_reason
  };
}

export async function getCurrentMotherProfile(): Promise<MotherProfile | null> {
  const motherId = await getMotherId();
  if (!motherId) {
    return null;
  }

  if (motherId === "mother-demo-id") {
    return {
      id: "mother-demo-id",
      name: "রহিমা বেগম",
      patientId: null,
      phone: null,
      gestationalAgeWeeks: 28,
      verificationStatus: "VERIFIED",
      lmpDate: new Date(Date.now() - 28 * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      chwEmail: null,
      chwPhone: null,
      rejectionReason: null
    };
  }

  try {
    const { data: mother, error } = await supabase
      .from("mothers")
      .select("id,name,patient_id,phone,gestational_age_weeks,is_active,verification_status,lmp_date,chw_email,chw_phone,rejection_reason")
      .eq("id", motherId)
      .maybeSingle<MotherRow>();

    if (error || !mother?.is_active) {
      if (error && (error.message.includes("verification_status") || error.message.includes("column") || error.code === "PGRST204")) {
        const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        return {
          id: motherId,
          name: user?.user_metadata?.name || "রহিমা বেগম",
          patientId: null,
          phone: user?.phone || null,
          gestationalAgeWeeks: 28,
          verificationStatus: "VERIFIED",
          lmpDate: new Date(Date.now() - 28 * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          chwEmail: null,
          chwPhone: null,
          rejectionReason: null
        };
      }
      return null;
    }

    return {
      id: mother.id,
      name: mother.name,
      patientId: mother.patient_id,
      phone: mother.phone,
      gestationalAgeWeeks: mother.gestational_age_weeks,
      verificationStatus: mother.verification_status || "VERIFIED",
      lmpDate: mother.lmp_date || new Date(Date.now() - (mother.gestational_age_weeks || 12) * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      chwEmail: mother.chw_email,
      chwPhone: mother.chw_phone,
      rejectionReason: mother.rejection_reason
    };
  } catch (err: any) {
    const errMsg = err?.message || "";
    if (errMsg.includes("verification_status") || errMsg.includes("column")) {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      return {
        id: motherId,
        name: user?.user_metadata?.name || "রহিমা বেগম",
        patientId: null,
        phone: user?.phone || null,
        gestationalAgeWeeks: 28,
        verificationStatus: "VERIFIED",
        lmpDate: new Date(Date.now() - 28 * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        chwEmail: null,
        chwPhone: null,
        rejectionReason: null
      };
    }
    return null;
  }
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

  if (chw) {
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
