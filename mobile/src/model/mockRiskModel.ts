import type { RiskInput, RiskPrediction } from "@/types/schema";

export async function predictMockRisk(input: RiskInput): Promise<RiskPrediction> {
  const reasons: string[] = [];

  if (input.bp_systolic > 140 || input.bp_diastolic > 90) {
    reasons.push("High blood pressure");
  }
  if (input.hemoglobin < 8) {
    reasons.push("Severe anemia");
  }
  if (input.symptom_flags.blurred_vision || input.symptom_flags.severe_headache) {
    reasons.push("Severe symptom reported");
  }
  if (input.swelling_present && (input.bp_systolic >= 130 || input.bp_diastolic >= 85)) {
    reasons.push("Swelling with elevated blood pressure");
  }

  if (reasons.length > 0) {
    return { risk_level: "HIGH", score: 0.9, reasons };
  }

  if (
    input.bp_systolic >= 130 ||
    input.bp_diastolic >= 85 ||
    input.hemoglobin < 10 ||
    input.swelling_present ||
    input.gestational_age_weeks > 36
  ) {
    return {
      risk_level: "MODERATE",
      score: 0.55,
      reasons: ["Borderline vitals or late gestational age"]
    };
  }

  return { risk_level: "LOW", score: 0.2, reasons: ["Vitals are within expected range"] };
}
