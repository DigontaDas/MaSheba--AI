import { ChwDirectoryClient } from "@/components/ChwDirectoryClient";
import { getChws, getPendingChws } from "@/utils/admin-api";
import { getTranslation } from "@/utils/translations";
import { getServerLanguage } from "@/utils/translations-server";

export const dynamic = "force-dynamic";

export default async function ChwsPage() {
  const [chws, pendingChws] = await Promise.all([
    getChws(),
    getPendingChws().catch(() => []),
  ]);
  const lang = await getServerLanguage();
  const t = getTranslation(lang);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t.chw_directory} description={t.chw_directory_desc} />
      <ChwDirectoryClient chws={chws} pendingChws={pendingChws} lang={lang} t={t} />
    </div>
  );
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="font-headline-lg text-headline-lg text-on-background">{title}</h2>
      <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{description}</p>
    </div>
  );
}
