export type RiskLevel = "LOW" | "MODERATE" | "HIGH";

export type OutboxStatus = "PENDING" | "SYNCED" | "DUPLICATE" | "FAILED";

export type EventType = "patient_upsert" | "visit_create";

export type SymptomFlags = Record<string, boolean>;

export type Patient = {
  id: string;
  chw_id: string;
  name: string;
  age: number;
  gestational_age_weeks: number;
  last_risk_level: RiskLevel;
  created_at: string;
  updated_at: string;
};

export type Visit = {
  id: string;
  patient_id: string;
  chw_id: string;
  bp_systolic: number;
  bp_diastolic: number;
  weight_kg: number;
  hemoglobin: number;
  swelling_present: boolean;
  symptom_flags: SymptomFlags;
  risk_level: RiskLevel;
  visited_at: string;
  device_id: string;
  created_at: string;
};

export type VisitInput = {
  bp_systolic: number;
  bp_diastolic: number;
  weight_kg: number;
  hemoglobin: number;
  swelling_present: boolean;
  symptom_flags: SymptomFlags;
};

export type RiskInput = VisitInput & {
  gestational_age_weeks: number;
};

export type RiskPrediction = {
  risk_level: RiskLevel;
  score?: number;
  reasons?: string[];
};

export type LocalOutboxEvent = {
  idempotency_key: string;
  chw_id: string;
  device_id: string;
  event_type: EventType;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  error_message: string | null;
  created_at: string;
  synced_at: string | null;
};

export type SyncResult = {
  idempotency_key: string;
  status: "SYNCED" | "DUPLICATE" | "FAILED";
  error?: string | null;
};

export type SyncResponse = {
  results: SyncResult[];
  synced_at: string;
};
