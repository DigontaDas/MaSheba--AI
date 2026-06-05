import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export const DEV_COOKIE = "maasheba_admin_dev";

export async function getAdminBearerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get("host")?.split(":")[0] || "";
  const isLocalRequest = ["127.0.0.1", "localhost", "::1"].includes(host);
  if (isLocalRequest && cookieStore.get(DEV_COOKIE)?.value === "1" && process.env.ADMIN_DEV_AUTH_ENABLED === "true") {
    return process.env.ADMIN_DEV_TOKEN || null;
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function requireAdminBearerToken(): Promise<string> {
  const token = await getAdminBearerToken();
  if (!token) {
    redirect("/login");
  }
  return token;
}
