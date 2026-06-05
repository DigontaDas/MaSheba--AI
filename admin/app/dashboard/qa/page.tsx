import { QaManager } from "@/components/QaManager";
import { getQaItems } from "@/utils/admin-api";

export const dynamic = "force-dynamic";

export default async function QaPage() {
  const items = await getQaItems();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-background">Offline Q&A Manager</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">Maintain bilingual maternal health answers synced to mobile users through `master_qa`.</p>
      </div>
      <QaManager items={items} />
    </div>
  );
}
