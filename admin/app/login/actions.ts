"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEV_COOKIE } from "@/utils/admin-auth";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function loginAction(_prevState: { error: string }, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const headerStore = await headers();
  const host = headerStore.get("host")?.split(":")[0] || "";
  const forwardedProto = headerStore.get("x-forwarded-proto") || "http";
  const isLocalRequest = ["127.0.0.1", "localhost", "::1"].includes(host);

  if (!email || !password) {
    return { error: "Enter both username/email and password." };
  }

  if (
    email.toLowerCase() === "admin" &&
    password === "admin123" &&
    isLocalRequest &&
    process.env.ADMIN_DEV_AUTH_ENABLED === "true" &&
    process.env.ADMIN_DEV_TOKEN
  ) {
    const cookieStore = await cookies();
    cookieStore.set(DEV_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: forwardedProto === "https" && !isLocalRequest,
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    redirect("/dashboard");
  }

  const supabase = await createServerSupabaseClient();
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.session) {
    return { error: result.error?.message || "Unable to sign in." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const hadDevSession = cookieStore.get(DEV_COOKIE)?.value === "1";
  cookieStore.delete(DEV_COOKIE);
  if (hadDevSession && process.env.ADMIN_DEV_AUTH_ENABLED === "true") {
    redirect("/login");
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
