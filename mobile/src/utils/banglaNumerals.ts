const digits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

export function toBanglaNumber(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}

export function formatBanglaCount(value: number, suffix = ""): string {
  return `${toBanglaNumber(value)}${suffix}`;
}
