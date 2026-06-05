import { NextResponse, type NextRequest } from "next/server";
import { updateChwStatus } from "@/utils/admin-api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (typeof body.chwId !== "string" || typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "Invalid CHW status payload." }, { status: 422 });
  }
  await updateChwStatus(body.chwId, body.isActive);
  return NextResponse.json({ ok: true });
}
