import { NativeModules } from "react-native";
import type { RiskInput, RiskPrediction } from "@/types/schema";
import { predictMockRisk } from "./mockRiskModel";

// Stub the missing native module in dev/emulator environments to prevent fatal TypeError crash
if (!NativeModules.Onnxruntime) {
  NativeModules.Onnxruntime = {
    install: () => {
      console.warn("Onnxruntime native module stub installed.");
    },
    isStub: true
  } as any;
}

declare const require: (path: string) => number;

export type RiskModel = {
  predict(input: RiskInput): Promise<RiskPrediction>;
};

type OrtModule = typeof import("onnxruntime-react-native");
type InferenceSession = Awaited<ReturnType<OrtModule["InferenceSession"]["create"]>>;

const MODEL_ASSET = require("../../assets/model.onnx");
const MODEL_INPUT_NAME = "risk_input";
const LABELS: Array<RiskPrediction["risk_level"]> = ["LOW", "MODERATE", "HIGH"];
const LEARNED_FEATURES = [
  "bp_systolic",
  "bp_diastolic",
  "weight_kg",
  "hemoglobin",
  "gestational_age_weeks"
] as const;

let sessionPromise: Promise<{ ort: OrtModule; session: InferenceSession } | null> | null = null;

function encodeLearnedFeatures(input: RiskInput): Float32Array {
  return Float32Array.from(LEARNED_FEATURES.map((feature) => Number(input[feature])));
}

function safetyRules(input: RiskInput): RiskPrediction {
  const reasons: string[] = [];

  if (input.bp_systolic >= 140 || input.bp_diastolic >= 90) {
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

async function loadSession(): Promise<{ ort: OrtModule; session: InferenceSession } | null> {
  // Gracefully fallback if the native module is absent or is our polyfill stub
  if (!NativeModules.Onnxruntime || (NativeModules.Onnxruntime as any).isStub) {
    return null;
  }

  sessionPromise ??= (async () => {
    try {
      const [{ Asset }, ort] = await Promise.all([
        import("expo-asset"),
        import("onnxruntime-react-native")
      ]);
      const [asset] = await Asset.loadAsync(MODEL_ASSET);
      const modelUri = asset.localUri ?? asset.uri;
      if (!modelUri) {
        return null;
      }
      const session = await ort.InferenceSession.create(modelUri);
      return { ort, session };
    } catch {
      return null;
    }
  })();
  return sessionPromise;
}

function numericOutputToPrediction(outputs: Record<string, unknown>): RiskPrediction | null {
  for (const output of Object.values(outputs)) {
    const data = (output as { data?: unknown }).data;
    if (!data || typeof data === "string") {
      continue;
    }

    const values = Array.from(data as Iterable<number>).filter((value) => Number.isFinite(value));
    if (values.length < LABELS.length) {
      continue;
    }

    const probabilities = values.slice(-LABELS.length);
    let bestIndex = 0;
    for (let index = 1; index < probabilities.length; index += 1) {
      if (probabilities[index] > probabilities[bestIndex]) {
        bestIndex = index;
      }
    }

    return {
      risk_level: LABELS[bestIndex],
      score: probabilities[bestIndex],
      reasons: ["ONNX risk model prediction"]
    };
  }

  return null;
}

function mergeWithSafety(modelPrediction: RiskPrediction, safetyPrediction: RiskPrediction): RiskPrediction {
  if (safetyPrediction.risk_level === "HIGH" && modelPrediction.risk_level !== "HIGH") {
    return safetyPrediction;
  }
  if (safetyPrediction.risk_level === "MODERATE" && modelPrediction.risk_level === "LOW") {
    return safetyPrediction;
  }
  return {
    ...modelPrediction,
    reasons: [...(modelPrediction.reasons ?? []), ...(safetyPrediction.reasons ?? [])]
  };
}

export const riskModel: RiskModel = {
  async predict(input) {
    const safetyPrediction = safetyRules(input);
    const loaded = await loadSession();
    if (!loaded) {
      return predictMockRisk(input);
    }

    try {
      const featureValues = encodeLearnedFeatures(input);
      const tensor = new loaded.ort.Tensor("float32", featureValues, [1, featureValues.length]);
      const outputs = await loaded.session.run({ [MODEL_INPUT_NAME]: tensor });
      const modelPrediction = numericOutputToPrediction(outputs);
      if (!modelPrediction) {
        return safetyPrediction;
      }
      return mergeWithSafety(modelPrediction, safetyPrediction);
    } catch {
      return safetyPrediction;
    }
  }
};
