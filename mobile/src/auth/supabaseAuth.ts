import { createClient } from "@supabase/supabase-js";
import type { Patient, RiskLevel } from "@/types/schema";
import { saveSession } from "./secureSession";
import { upsertPatients } from "@/db/patients";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export const supabase = createClient(
  requireEnv(supabaseUrl, "EXPO_PUBLIC_SUPABASE_URL"),
  requireEnv(supabaseAnonKey, "EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

type ChwRow = {
  id: string;
  is_active: boolean;
};

type PatientRow = {
  id: string;
  chw_id: string;
  name: string;
  age: number;
  gestational_age_weeks: number;
  last_risk_level: string;
  created_at: string;
  updated_at: string;
};

export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  // Normalize simple Bangladeshi numbers (e.g. 01712345678 or 1712345678)
  if (/^01\d{9}$/.test(trimmed)) {
    return `+88${trimmed}`;
  }
  if (/^1\d{9}$/.test(trimmed)) {
    return `+880${trimmed}`;
  }
  if (/^\+8801\d{9}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

export async function loginAndBootstrap(identifier: string, password: string): Promise<{ chwId: string }> {
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
        // Fallback to phone email mapping
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

  const { data: chw, error: chwError } = await supabase
    .from("chws")
    .select("id,is_active")
    .eq("auth_user_id", data.session.user.id)
    .single<ChwRow>();

  if (chwError || !chw) {
    throw new Error(chwError?.message ?? "Authenticated user has no health worker profile");
  }

  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id,chw_id,name,age,gestational_age_weeks,last_risk_level,created_at,updated_at")
    .eq("chw_id", chw.id)
    .order("updated_at", { ascending: false })
    .returns<PatientRow[]>();

  if (patientsError) {
    throw new Error(patientsError.message);
  }

  await saveSession({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    chwId: chw.id
  });

  await upsertPatients(
    (patients ?? []).map((patient): Patient => ({
      ...patient,
      last_risk_level: patient.last_risk_level as RiskLevel
    }))
  );

  return { chwId: chw.id };
}

async function getProfileIdForSession(authUserId: string, role: "chw" | "mother"): Promise<string> {
  if (role === "chw") {
    const { data: chwRecord } = await supabase
      .from("chws")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (chwRecord) return chwRecord.id;
  } else if (role === "mother") {
    const { data: motherRecord } = await supabase
      .from("mothers")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (motherRecord) return motherRecord.id;
  }
  return authUserId;
}

export async function signUpAndBootstrap(
  identifier: string,
  password: string,
  role: "chw" | "mother",
  name: string,
  extraMetadata: Record<string, any>
): Promise<{ sessionEstablished: boolean }> {
  const isEmail = identifier.includes("@");

  if (isEmail) {
    const { data, error } = await supabase.auth.signUp({
      email: identifier.trim().toLowerCase(),
      password,
      options: {
        data: {
          name,
          role,
          ...extraMetadata
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("This email is already registered. Please log in or use a different email.");
    }

    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });

      const profileId = await getProfileIdForSession(data.session.user.id, role);
      await saveSession({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        chwId: profileId
      });

      return { sessionEstablished: true };
    }

    return { sessionEstablished: false };
  } else {
    const phoneNormalized = normalizePhone(identifier);
    const finalMetadata = {
      ...extraMetadata,
      phone: phoneNormalized
    };

    try {
      const { data, error } = await supabase.auth.signUp({
        phone: phoneNormalized,
        password,
        options: {
          data: {
            name,
            role,
            ...finalMetadata
          }
        }
      });

      if (error) {
        // Fallback to phone email mapping
        const fallbackEmail = `${phoneNormalized.replace("+", "")}@maasheba.phone`;
        const { data: fbData, error: fbError } = await supabase.auth.signUp({
          email: fallbackEmail,
          password,
          options: {
            data: {
              name,
              role,
              ...finalMetadata
            }
          }
        });

        if (fbError) {
          throw new Error(fbError.message);
        }

        if (fbData.session) {
          await supabase.auth.setSession({
            access_token: fbData.session.access_token,
            refresh_token: fbData.session.refresh_token
          });

          const profileId = await getProfileIdForSession(fbData.session.user.id, role);
          await saveSession({
            accessToken: fbData.session.access_token,
            refreshToken: fbData.session.refresh_token,
            chwId: profileId
          });

          return { sessionEstablished: true };
        }
        return { sessionEstablished: false };
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        const profileId = await getProfileIdForSession(data.session.user.id, role);
        await saveSession({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          chwId: profileId
        });

        return { sessionEstablished: true };
      }

      return { sessionEstablished: false };
    } catch (err: any) {
      throw new Error(err.message || "Sign up failed");
    }
  }
}

