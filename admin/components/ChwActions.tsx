"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function ChwStatusButton({
  chwId,
  isActive,
}: {
  chwId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      await fetch(`/dashboard/chws/status`, {
        method: "POST",
        body: JSON.stringify({ chwId, isActive: !isActive }),
      });
      router.refresh();
    });
  }

  return (
    <button
      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      disabled={pending}
      onClick={submit}
      type="button"
    >
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
