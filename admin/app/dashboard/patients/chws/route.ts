import { NextResponse } from "next/server";
import { getChws } from "@/utils/admin-api";

export async function GET() {
  try {
    const chws = await getChws();
    return NextResponse.json({ chws });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch CHWs." },
      { status: 500 }
    );
  }
}
