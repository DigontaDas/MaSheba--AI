import { UpazilaRiskMap } from "@/components/UpazilaRiskMap";
import { getSummary } from "@/utils/admin-api";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const summary = await getSummary();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-background">Upazila Risk Density Map</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">Static local map layer. No external map API or location service is used.</p>
      </div>
      <UpazilaRiskMap rows={summary.heatmap} />
    </div>
  );
}
