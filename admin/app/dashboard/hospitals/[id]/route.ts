import { NextResponse, type NextRequest } from "next/server";
import { updateHospital, deleteHospital } from "@/utils/admin-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await request.json();
    const updated = await updateHospital(id, data);
    return NextResponse.json({ ok: true, hospital: updated });
  } catch (error: any) {
    console.error("Error updating hospital:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update hospital." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteHospital(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting hospital:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete hospital." },
      { status: 500 }
    );
  }
}
