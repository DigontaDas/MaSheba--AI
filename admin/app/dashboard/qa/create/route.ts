import { NextResponse, type NextRequest } from "next/server";
import { createQaItem } from "@/utils/admin-api";

export async function POST(request: NextRequest) {
  try {
    await createQaItem(await request.json());
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error creating QA item:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create QA item." },
      { status: 500 }
    );
  }
}
