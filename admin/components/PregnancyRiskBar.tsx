import { Language } from "@/utils/translations";

type PregnancyRiskProps = {
  high: number;
  moderate: number;
  low: number;
  lang: Language;
};

export function PregnancyRiskBar({ high, moderate, low, lang }: PregnancyRiskProps) {
  const total = high + moderate + low;
  const highPct = total > 0 ? (high / total) * 100 : 0;
  const modPct = total > 0 ? (moderate / total) * 100 : 0;
  const lowPct = total > 0 ? (low / total) * 100 : 0;

  // Local helper for localized numbers
  const toLocalNum = (num: number) => {
    if (lang === "bn") {
      const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      return num.toString().split("").map(c => bnNums[parseInt(c)] || c).join("");
    }
    return num.toString();
  };

  const title = lang === "bn" ? "গর্ভকালীন ঝুঁকি বিশ্লেষণ" : "Pregnancy Risk Analysis";
  const labelHigh = lang === "bn" ? "উচ্চ ঝুঁকি" : "High Risk";
  const labelMod = lang === "bn" ? "মাঝারি ঝুঁকি" : "Moderate Risk";
  const labelLow = lang === "bn" ? "নিম্ন ঝুঁকি" : "Low Risk";

  return (
    <div className="rounded-3xl border border-brand-accent/10 bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-800 mb-4">{title}</h3>

      {/* Segmented Bar */}
      <div className="h-4.5 w-full flex rounded-full overflow-hidden bg-slate-100 shadow-inner">
        {total === 0 ? (
          <div className="h-full w-full bg-slate-300"></div>
        ) : (
          <>
            {high > 0 && (
              <div
                className="h-full bg-risk-high transition-all duration-300"
                style={{ width: `${highPct}%` }}
                title={`${labelHigh}: ${high} (${highPct.toFixed(1)}%)`}
              ></div>
            )}
            {moderate > 0 && (
              <div
                className="h-full bg-risk-moderate transition-all duration-300"
                style={{ width: `${modPct}%` }}
                title={`${labelMod}: ${moderate} (${modPct.toFixed(1)}%)`}
              ></div>
            )}
            {low > 0 && (
              <div
                className="h-full bg-risk-low transition-all duration-300"
                style={{ width: `${lowPct}%` }}
                title={`${labelLow}: ${low} (${lowPct.toFixed(1)}%)`}
              ></div>
            )}
          </>
        )}
      </div>

      {/* Legend Dots */}
      <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 mt-4 text-xs font-bold">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="h-3 w-3 rounded-full bg-risk-high"></span>
          <span>{labelHigh}: {toLocalNum(high)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="h-3 w-3 rounded-full bg-risk-moderate"></span>
          <span>{labelMod}: {toLocalNum(moderate)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="h-3 w-3 rounded-full bg-risk-low"></span>
          <span>{labelLow}: {toLocalNum(low)}</span>
        </div>
      </div>
    </div>
  );
}
