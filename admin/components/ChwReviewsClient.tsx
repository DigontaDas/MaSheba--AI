"use client";

import { useMemo, useState } from "react";
import { getChwReviews, moderateChwReview } from "@/utils/admin-api";
import type { ChwReview, ChwReviewSummary } from "@/utils/admin-types";

export function ChwReviewsClient({
  summaries,
  initialReviews,
}: {
  summaries: ChwReviewSummary[];
  initialReviews: ChwReview[];
}) {
  const [selectedChwId, setSelectedChwId] = useState<string>(summaries[0]?.chw_id ?? "");
  const [reviews, setReviews] = useState<ChwReview[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSummary = useMemo(
    () => summaries.find((summary) => summary.chw_id === selectedChwId),
    [selectedChwId, summaries]
  );

  const visibleReviews = useMemo(
    () => reviews.filter((review) => !selectedChwId || review.chw_id === selectedChwId),
    [reviews, selectedChwId]
  );

  async function selectChw(chwId: string) {
    setSelectedChwId(chwId);
    setLoading(true);
    setError(null);
    try {
      setReviews(await getChwReviews(chwId));
    } catch (err: any) {
      setError(err.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }

  async function updateModeration(reviewId: string, status: ChwReview["status"]) {
    setLoading(true);
    setError(null);
    try {
      await moderateChwReview(reviewId, status, status === "active" ? undefined : "Admin moderation");
      setReviews(await getChwReviews(selectedChwId));
    } catch (err: any) {
      setError(err.message || "Failed to update review.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm">
          <div className="border-b border-outline-variant bg-surface-container-low p-4">
            <h3 className="font-headline-md text-[18px] font-bold text-on-surface">CHW Rating Summary</h3>
            <p className="text-xs font-label-sm text-on-surface-variant">Low-rated CHWs under 3.0 are highlighted.</p>
          </div>
          <div className="max-h-[620px] divide-y divide-outline-variant/60 overflow-y-auto">
            {summaries.map((summary) => {
              const selected = summary.chw_id === selectedChwId;
              return (
                <button
                  className={`w-full cursor-pointer p-4 text-left transition-colors ${
                    selected ? "border-l-4 border-primary bg-primary-container/10" : "hover:bg-surface-container-lowest"
                  } ${summary.is_low_rated ? "bg-error-container/10" : ""}`}
                  key={summary.chw_id}
                  onClick={() => selectChw(summary.chw_id)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-on-surface">{summary.chw_name}</p>
                      <p className="text-xs text-on-surface-variant">{summary.review_count} reviews</p>
                    </div>
                    <div className="rounded-lg bg-surface-container px-3 py-1 text-sm font-bold text-on-surface">
                      {Number(summary.average_rating).toFixed(1)} ★
                    </div>
                  </div>
                </button>
              );
            })}
            {summaries.length === 0 && (
              <p className="p-8 text-center text-sm font-semibold text-on-surface-variant">No CHWs found.</p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="rounded-xl border border-outline-variant bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-headline-md text-[18px] font-bold text-on-surface">
                {selectedSummary?.chw_name || "Reviews"}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Average {Number(selectedSummary?.average_rating ?? 0).toFixed(1)} from {selectedSummary?.review_count ?? 0} reviews
              </p>
            </div>
            {loading && <span className="text-xs font-bold text-primary">Loading...</span>}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-error bg-error-container/20 p-3 text-xs font-bold text-error">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {visibleReviews.map((review) => (
              <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4" key={review.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {review.rating} ★ from {review.mother_first_name}
                    </p>
                    <p className="text-xs text-on-surface-variant">{new Date(review.created_at).toLocaleString()}</p>
                  </div>
                  <span className="rounded-full bg-surface-container px-2 py-1 text-[10px] font-bold uppercase text-on-surface-variant">
                    {review.status}
                  </span>
                </div>
                {review.review_text && <p className="mt-3 text-sm text-on-surface">{review.review_text}</p>}
                {review.moderation_reason && (
                  <p className="mt-2 text-xs font-semibold text-error">Reason: {review.moderation_reason}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container"
                    disabled={loading}
                    onClick={() => updateModeration(review.id, "active")}
                    type="button"
                  >
                    Restore
                  </button>
                  <button
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"
                    disabled={loading}
                    onClick={() => updateModeration(review.id, "flagged")}
                    type="button"
                  >
                    Flag
                  </button>
                  <button
                    className="rounded-lg border border-error bg-error-container/20 px-3 py-2 text-xs font-bold text-error"
                    disabled={loading}
                    onClick={() => updateModeration(review.id, "removed")}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {visibleReviews.length === 0 && (
              <p className="rounded-lg border border-dashed border-outline-variant p-8 text-center text-sm font-semibold text-on-surface-variant">
                No reviews for this CHW yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
