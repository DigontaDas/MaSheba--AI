export function nowIso(): string {
  return new Date().toISOString();
}

export function minutesSince(iso: string | null): string {
  if (!iso) {
    return "Never";
  }

  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "Just now";
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes === 1) {
    return "1 min ago";
  }
  return `${minutes} min ago`;
}
