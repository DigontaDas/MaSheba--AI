import { PatientsRegistryClient } from "@/components/PatientsRegistryClient";
import { getPatients, getChws, getSummary } from "@/utils/admin-api";
import { getTranslation } from "@/utils/translations";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const [patients, chws, summary] = await Promise.all([
    getPatients(),
    getChws(),
    getSummary(),
  ]);
  const t = getTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-background">{t.tracked_mothers}</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{t.tracked_mothers_desc}</p>
      </div>
      <PatientsRegistryClient patients={patients} chws={chws} heatmap={summary.heatmap} t={t} />
    </div>
  );
}
