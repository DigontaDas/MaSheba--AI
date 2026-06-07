import { ConnectionRequestsClient } from "@/components/ConnectionRequestsClient";
import { getChws, getPendingRequests } from "@/utils/admin-api";

export const dynamic = "force-dynamic";

export default async function ConnectionRequestsPage() {
  const [requests, chws] = await Promise.all([
    getPendingRequests().catch(() => []),
    getChws().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Location-Based CHW Matching"
        description="View real-time coordinates of mothers requesting support and assign nearby Community Health Workers."
      />
      <ConnectionRequestsClient initialRequests={requests} chws={chws} />
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
