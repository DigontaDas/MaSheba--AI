import { exportUrl } from "@/utils/admin-api";

export default function ExportsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-background">Reports & Exports</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          Generate structured, offline patient logs and analytics summaries for health coordinators.
        </p>
      </div>

      {/* Export Options Grid */}
      <div className="grid gap-gutter md:grid-cols-2">
        <a
          className="rounded-xl border border-outline-variant bg-surface p-card-padding hover:border-primary flex flex-col gap-2 transition-colors cursor-pointer shadow-sm"
          href={exportUrl("csv")}
        >
          <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">description</span>
            CSV Patient Registry Log
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">
            Tabular patient data export containing full pregnancy timelines and CHW logs for spreadsheet review.
          </p>
        </a>

        <a
          className="rounded-xl border border-outline-variant bg-surface p-card-padding hover:border-primary flex flex-col gap-2 transition-colors cursor-pointer shadow-sm"
          href={exportUrl("pdf")}
        >
          <h3 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
            Printable PDF Triage Report
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">
            Print-friendly summary outlining high-risk alerts and pregnancy counts aggregated by regional upazila.
          </p>
        </a>
      </div>
    </div>
  );
}
