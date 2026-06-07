export function nowIso(): string {
  return new Date().toISOString();
}

export function minutesSince(iso: string | null, language: "bn" | "en" = "en"): string {
  if (!iso) {
    return language === "bn" ? "কখনো না" : "Never";
  }

  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return language === "bn" ? "এইমাত্র" : "Just now";
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return language === "bn" ? "এইমাত্র" : "Just now";
  }
  if (minutes === 1) {
    return language === "bn" ? "১ মিনিট আগে" : "1 min ago";
  }
  return language === "bn" ? `${minutes} মিনিট আগে` : `${minutes} min ago`;
}

