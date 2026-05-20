import type { RiskInput, RiskPrediction } from "@/types/schema";
import { predictMockRisk } from "./mockRiskModel";

export type RiskModel = {
  predict(input: RiskInput): Promise<RiskPrediction>;
};

export const riskModel: RiskModel = {
  predict(input) {
    return predictMockRisk(input);
  }
};
