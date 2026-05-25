import { colors } from "@/theme";
import type { RiskLevel } from "@/types/schema";

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function formatShortDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "short"
  }).format(date);
}

export function formatSyncTime(iso: string | null): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("bn-BD", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function getRiskBorderColor(level: RiskLevel): string {
  if (level === "HIGH") {
    return colors.error;
  }
  if (level === "MODERATE") {
    return "#f59e0b";
  }
  return colors.secondary;
}
