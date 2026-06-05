import { PatientsRegistryClient } from "@/components/PatientsRegistryClient";
import { getPatients } from "@/utils/admin-api";
import { getTranslation } from "@/utils/translations";
import { getServerLanguage } from "@/utils/translations-server";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const patients = await getPatients();
  const lang = await getServerLanguage();
  const t = getTranslation(lang);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-background">{t.tracked_mothers}</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{t.tracked_mothers_desc}</p>
      </div>
      <PatientsRegistryClient patients={patients} lang={lang} t={t} />
    </div>
  );
}
