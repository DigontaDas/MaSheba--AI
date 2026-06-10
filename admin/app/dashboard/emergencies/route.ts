import { NextResponse } from "next/server";
import { getEmergencies } from "@/utils/admin-api";

export async function GET() {
  try {
    const emergencies = await getEmergencies();
    return NextResponse.json({ emergencies });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch emergencies." },
      { status: 500 }
    );
  }
}
