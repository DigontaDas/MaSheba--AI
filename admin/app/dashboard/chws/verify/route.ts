import { NextResponse, type NextRequest } from "next/server";
import { updateChwVerification } from "@/utils/admin-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.chwId !== "string" || !["APPROVED", "REJECTED"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid verification payload." }, { status: 422 });
    }
    await updateChwVerification(body.chwId, body.status, body.rejectionReason);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Verification failed." }, { status: 500 });
  }
}
