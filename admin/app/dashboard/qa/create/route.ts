import { NextResponse, type NextRequest } from "next/server";
import { createQaItem } from "@/utils/admin-api";

export async function POST(request: NextRequest) {
  await createQaItem(await request.json());
  return NextResponse.json({ ok: true });
}
