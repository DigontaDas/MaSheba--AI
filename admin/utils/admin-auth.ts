import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export const DEV_COOKIE = "maasheba_admin_dev";

/** Sentinel error class so callers can detect auth failures vs backend errors */
export class AdminSessionExpiredError extends Error {
  constructor() {
    super("Your session has expired. Please refresh the page and log in again.");
    this.name = "AdminSessionExpiredError";
  }
}

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

/**
 * Returns the current admin bearer token.
 * - When called from a Server Component (page render), redirects to /login on missing token.
 * - When called from a Server Action (client event), throws AdminSessionExpiredError so the
 *   client can show a readable error instead of the cryptic NEXT_REDIRECT message.
 */
export async function requireAdminBearerToken(options?: { isAction?: boolean }): Promise<string> {
  const token = await getAdminBearerToken();
  if (!token) {
    if (options?.isAction) {
      throw new AdminSessionExpiredError();
    }
    redirect("/login");
  }
  return token;
}
