import { NextResponse, type NextRequest } from "next/server";
import { createHospital } from "@/utils/admin-api";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const created = await createHospital(data);
    return NextResponse.json({ ok: true, hospital: created });
  } catch (error: any) {
    console.error("Error creating hospital:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create hospital." },
      { status: 500 }
    );
  }
}
