"use client";

import { useEffect, useState } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log the error to telemetry/console for operation logs
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center">
      <div className="max-w-md w-full bg-surface border border-outline-variant/60 rounded-3xl p-8 md:p-10 shadow-xl space-y-6">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-error-container/20 flex items-center justify-center text-error border border-error/20 animate-pulse">
          <span className="material-symbols-outlined text-[36px] font-bold">warning</span>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="font-headline-md text-[24px] font-bold text-on-surface">
            Something went wrong
          </h2>
          <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
            The MaaSheba Admin Workspace encountered an unexpected error while rendering this view.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-label-lg font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/50 font-label-lg font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            Return Home
          </button>
        </div>

        {/* Technical Details Collapsible */}
        <div className="border-t border-outline-variant/30 pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center gap-1 mx-auto text-xs font-label-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <span>{showDetails ? "Hide" : "Show"} technical details</span>
            <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`}>
              keyboard_arrow_down
            </span>
          </button>

          {showDetails && (
            <div className="mt-4 text-left p-4 rounded-xl bg-surface-container border border-outline-variant/50 font-mono text-[11px] text-error overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar">
              <p className="font-semibold mb-1">Message: {error.message || "Unknown error"}</p>
              {error.digest && <p className="text-on-surface-variant mb-1">Digest: {error.digest}</p>}
              {error.stack && (
                <pre className="text-[10px] text-on-surface-variant/80 mt-2 overflow-x-auto leading-normal">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
