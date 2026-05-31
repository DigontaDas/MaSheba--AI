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

export async function loginAndBootstrap(email: string, password: string): Promise<{ chwId: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(error?.message ?? "Unable to sign in");
  }

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });

  const { data: chw, error: chwError } = await supabase
    .from("chws")
    .select("id,is_active")
    .eq("auth_user_id", data.session.user.id)
    .single<ChwRow>();

  if (chwError || !chw?.is_active) {
    throw new Error(chwError?.message ?? "Authenticated user is not an active CHW");
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

export async function signUpAndBootstrap(
  email: string,
  password: string,
  role: "chw" | "mother",
  name: string,
  extraMetadata: Record<string, any>
): Promise<{ sessionEstablished: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
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

  // If Supabase immediately returns a session (e.g. if email confirmation is disabled)
  if (data.session) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });

    await saveSession({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      chwId: data.session.user.id
    });

    return { sessionEstablished: true };
  }

  return { sessionEstablished: false };
}

