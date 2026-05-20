export const RISK_LEVELS = ["LOW", "MODERATE", "HIGH"] as const;

export const SYMPTOM_OPTIONS = [
  { key: "headache", label: "Headache" },
  { key: "severe_headache", label: "Severe headache" },
  { key: "blurred_vision", label: "Blurred vision" },
  { key: "dizziness", label: "Dizziness" },
  { key: "fatigue", label: "Fatigue" },
  { key: "abdominal_pain", label: "Abdominal pain" }
] as const;
