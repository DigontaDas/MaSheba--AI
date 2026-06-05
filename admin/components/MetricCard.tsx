export function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "risk" | "success";
}) {
  // Render corresponding icon matching the mobile UI
  const renderIcon = () => {
    const norm = label.toLowerCase();
    if (norm.includes("chw")) {
      return (
        <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm mb-2">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
      );
    }
    if (norm.includes("patient") || norm.includes("mother") || norm.includes("মা")) {
      if (norm.includes("high") || norm.includes("উচ্চ")) {
        return (
          <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-risk-high shadow-sm mb-2">
            <svg className="h-6 w-6 rotate-45" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect x="3" y="9" width="18" height="6" rx="2.5" stroke="currentColor" strokeWidth="2" />
              <rect x="9" y="3" width="6" height="18" rx="2.5" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" />
            </svg>
          </div>
        );
      }
      return (
        <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm mb-2">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      );
    }
    return null;
  };

  const labelClass = tone === "risk" ? "text-risk-high font-bold" : "text-slate-500 font-semibold";
  const valueClass = tone === "risk" ? "text-risk-high font-extrabold" : "text-slate-800 font-extrabold";

  return (
    <div className="rounded-3xl border border-brand-accent/10 bg-white p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col items-center justify-center text-center">
      {renderIcon()}
      <p className={`text-sm ${labelClass}`}>{label}</p>
      <p className={`mt-1 text-3xl tracking-tight ${valueClass}`}>{value}</p>
    </div>
  );
}
