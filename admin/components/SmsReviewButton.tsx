"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function SmsReviewButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="bg-surface border border-outline hover:bg-surface-container-high px-3 py-1 rounded-full text-xs font-semibold font-label-lg text-on-surface transition-colors cursor-pointer select-none disabled:opacity-60"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await fetch(`/dashboard/telemetry/${id}`, {
            method: "POST",
            body: JSON.stringify({ review_status: "REVIEWED", review_notes: "Reviewed in admin console." }),
          });
          router.refresh();
        });
      }}
      type="button"
    >
      {pending ? "Reviewing..." : "Mark Reviewed"}
    </button>
  );
}
