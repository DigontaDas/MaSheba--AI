import { ChwReviewsClient } from "@/components/ChwReviewsClient";
import { getChwReviews, getChwReviewSummary } from "@/utils/admin-api";

export const dynamic = "force-dynamic";

export default async function ChwReviewsPage() {
  const summaries = await getChwReviewSummary().catch(() => []);
  const initialReviews = summaries[0]?.chw_id ? await getChwReviews(summaries[0].chw_id).catch(() => []) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CHW Reviews"
        description="Review mother feedback, monitor low-rated health workers, and moderate abusive reviews."
      />
      <ChwReviewsClient summaries={summaries} initialReviews={initialReviews} />
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
