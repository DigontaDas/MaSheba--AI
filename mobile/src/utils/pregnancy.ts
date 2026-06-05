export function getPregnancyWeeks(lmpDateStr: string | null | undefined, defaultWeeks: number | null | undefined): number {
  if (!lmpDateStr) {
    return defaultWeeks || 12;
  }
  try {
    const lmp = new Date(lmpDateStr);
    if (isNaN(lmp.getTime())) {
      return defaultWeeks || 12;
    }
    const today = new Date();
    const diffTime = today.getTime() - lmp.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    return Math.max(1, Math.min(45, weeks));
  } catch {
    return defaultWeeks || 12;
  }
}

export function getLmpDateFromWeeks(weeks: number): string {
  const today = new Date();
  const diffTime = weeks * 7 * 24 * 60 * 60 * 1000;
  const lmp = new Date(today.getTime() - diffTime);
  return lmp.toISOString().split("T")[0]; // YYYY-MM-DD format
}
