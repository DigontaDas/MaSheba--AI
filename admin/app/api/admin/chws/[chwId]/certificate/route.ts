import { NextResponse, type NextRequest } from "next/server";
import { requireAdminBearerToken } from "@/utils/admin-auth";

const apiBaseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chwId: string }> }
) {
  try {
    const { chwId } = await params;
    const token = await requireAdminBearerToken();
    const response = await fetch(`${apiBaseUrl}/api/v1/admin/chws/${encodeURIComponent(chwId)}/certificate`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to retrieve certificate." }, { status: response.status });
    }

    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
      },
    });
  } catch (error: any) {
    console.error("Error retrieving certificate:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve certificate." },
      { status: 500 }
    );
  }
}
