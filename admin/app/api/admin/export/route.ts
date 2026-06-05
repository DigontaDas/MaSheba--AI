import { NextResponse, type NextRequest } from "next/server";
import { requireAdminBearerToken } from "@/utils/admin-auth";

const apiBaseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const token = await requireAdminBearerToken();
  const format = request.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "csv";
  const response = await fetch(`${apiBaseUrl}/api/v1/admin/reports/export?format=${format}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Export failed." }, { status: response.status });
  }

  const body = await response.arrayBuffer();
  return new NextResponse(body, {
    headers: {
      "Content-Type": response.headers.get("content-type") || (format === "pdf" ? "application/pdf" : "text/csv"),
      "Content-Disposition": response.headers.get("content-disposition") || `attachment; filename=maasheba-report.${format}`,
    },
  });
}
