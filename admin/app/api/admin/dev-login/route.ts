import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { DEV_COOKIE } from "@/utils/admin-auth";

export async function POST() {
  const headerStore = await headers();
  const host = headerStore.get("host")?.split(":")[0] || "";
  const forwardedProto = headerStore.get("x-forwarded-proto") || "http";
  const isLocalRequest = ["127.0.0.1", "localhost", "::1"].includes(host);

  if (!isLocalRequest || process.env.ADMIN_DEV_AUTH_ENABLED !== "true" || !process.env.ADMIN_DEV_TOKEN) {
    return NextResponse.json({ error: "Local admin dev login is disabled." }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set(DEV_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: forwardedProto === "https" && !isLocalRequest,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true });
}
