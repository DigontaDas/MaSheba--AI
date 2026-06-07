import { NextResponse, type NextRequest } from "next/server";
import { deleteQaItem, updateQaItem } from "@/utils/admin-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await updateQaItem(id, await request.json());
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error updating QA item:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update QA item." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteQaItem(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting QA item:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete QA item." },
      { status: 500 }
    );
  }
}
