import { SmsReviewButton } from "@/components/SmsReviewButton";
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

      {/* Telemetry Catalog Card */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
          <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Sync and Transmission Ledger
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-3.5 font-medium">Recipient Phone</th>
                <th className="px-6 py-3.5 font-medium">Attempts</th>
                <th className="px-6 py-3.5 font-medium">Error Details</th>
                <th className="px-6 py-3.5 font-medium">Review Status</th>
                <th className="px-6 py-3.5 font-medium">Created Time</th>
                <th className="px-6 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant bg-surface">
              {failures.map((failure) => (
                <tr key={failure.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-3.5 font-bold text-on-surface">
                    {failure.phone_number}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-on-surface-variant font-bold tabular-nums">
                    {failure.attempts}
                  </td>
                  <td className="max-w-md truncate px-6 py-3.5 text-on-surface-variant">
                    {failure.error_message || "None"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5">
                    {failure.review_status === "OPEN" ? (
                      <span className="inline-flex items-center gap-1 bg-secondary-container/20 text-on-secondary-container px-2.5 py-0.5 rounded-full text-xs font-bold border border-secondary-container/45">
                        <span className="material-symbols-outlined text-[12px]">gpp_maybe</span>
                        {failure.review_status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-primary-container/20 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold border border-primary-container/45">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        {failure.review_status}
                      </span>
                    )}
                  </td>
                  <td suppressHydrationWarning className="whitespace-nowrap px-6 py-3.5 text-on-surface-variant font-semibold text-xs font-label-sm">
                    {new Date(failure.created_at).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-right font-label-lg">
                    {failure.review_status === "OPEN" ? (
                      <SmsReviewButton id={failure.id} />
                    ) : (
                      <span className="text-xs font-semibold text-on-surface-variant/65 italic">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
              {failures.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center font-bold text-on-surface-variant">
                    No telemetry failures logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
