import { NextResponse, type NextRequest } from "next/server";
import { assignChw } from "@/utils/admin-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.motherId !== "string" || typeof body.chwId !== "string") {
      return NextResponse.json({ error: "Invalid payload: motherId and chwId are required." }, { status: 422 });
    }
    const updatedRow = await assignChw(body.motherId, body.chwId, body.age);
    return NextResponse.json({ ok: true, data: updatedRow });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Assignment failed." }, { status: 500 });
  }
}
