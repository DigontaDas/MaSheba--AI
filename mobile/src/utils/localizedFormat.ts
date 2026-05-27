import { toBanglaNumber } from "./banglaNumerals";

export function formatNumber(value: number | string, language: "bn" | "en"): string {
  return language === "bn" ? toBanglaNumber(value) : String(value);
}

export function weekLabel(week: number, language: "bn" | "en"): string {
  return language === "bn" ? `সপ্তাহ ${toBanglaNumber(week)}` : `Week ${week}`;
}

export function weeksLeftLabel(weeks: number, language: "bn" | "en"): string {
  return language === "bn" ? `আর ${toBanglaNumber(weeks)} সপ্তাহ বাকি` : `${weeks} weeks left`;
}
