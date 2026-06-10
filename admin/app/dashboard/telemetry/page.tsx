import { TelemetryClient } from "@/components/TelemetryClient";
import { getSmsFailures } from "@/utils/admin-api";

export const dynamic = "force-dynamic";

export default async function TelemetryPage() {
  const failures = await getSmsFailures();
  const openCount = failures.filter((failure) => failure.review_status === "OPEN").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-background">SMS & USSD Telemetry</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          {openCount} open SMS failures require administrative review.
        </p>
      </div>

      <TelemetryClient initialFailures={failures} />
    </div>
  );
}
