import { PatientsRegistryClient } from "@/components/PatientsRegistryClient";
import { getPatients, getChws } from "@/utils/admin-api";
import { getTranslation } from "@/utils/translations";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const [patients, chws] = await Promise.all([
    getPatients(),
    getChws(),
  ]);
  const t = getTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-background">{t.tracked_mothers}</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{t.tracked_mothers_desc}</p>
      </div>
      <PatientsRegistryClient patients={patients} chws={chws} t={t} />
    </div>
  );
}
