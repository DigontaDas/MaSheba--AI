import { NextResponse, type NextRequest } from "next/server";
import { reviewSmsFailure } from "@/utils/admin-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  await reviewSmsFailure(id, body.review_status, body.review_notes || "");
  return NextResponse.json({ ok: true });
}
