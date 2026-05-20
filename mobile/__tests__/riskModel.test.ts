import { predictMockRisk } from "@/model/mockRiskModel";
import type { RiskInput } from "@/types/schema";

const baseInput: RiskInput = {
  bp_systolic: 110,
  bp_diastolic: 72,
  weight_kg: 52,
  hemoglobin: 11,
  gestational_age_weeks: 28,
  swelling_present: false,
  symptom_flags: {}
};

describe("predictMockRisk", () => {
  it("returns HIGH for severe blood pressure", async () => {
    await expect(predictMockRisk({ ...baseInput, bp_systolic: 150 })).resolves.toMatchObject({
      risk_level: "HIGH"
    });
  });

  it("returns HIGH for severe anemia", async () => {
    await expect(predictMockRisk({ ...baseInput, hemoglobin: 7.5 })).resolves.toMatchObject({
      risk_level: "HIGH"
    });
  });

  it("returns MODERATE for borderline vitals", async () => {
    await expect(predictMockRisk({ ...baseInput, bp_diastolic: 86 })).resolves.toMatchObject({
      risk_level: "MODERATE"
    });
  });

  it("returns LOW for normal vitals", async () => {
    await expect(predictMockRisk(baseInput)).resolves.toMatchObject({
      risk_level: "LOW"
    });
  });
});
