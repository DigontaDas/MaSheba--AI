export type RiskLevel = "LOW" | "MODERATE" | "HIGH";

export type ChwRow = {
  chw_id: string;
  name: string;
  union_name: string;
  upazila: string;
  is_active: boolean;
  patient_count: number;
};

export type RiskSummaryRow = {
  chw_id: string;
  chw_name: string;
  low_count: number;
  moderate_count: number;
  high_count: number;
};

export type HeatmapRow = {
  upazila: string;
  low_count: number;
  moderate_count: number;
  high_count: number;
  total_patients: number;
};

export type PatientRow = {
  id: string;
  chw_id: string;
  name: string;
  age: number;
  gestational_age_weeks: number;
  last_risk_level: RiskLevel;
  created_at: string;
  updated_at: string;
};

export type QaItem = {
  id: string;
  trimester: "T1" | "T2" | "T3" | "POSTPARTUM" | "ALL";
  topic: string;
  question_bn: string;
  answer_bn: string;
  question_en: string;
  answer_en: string;
  severity: RiskLevel;
  created_at: string;
  updated_at: string;
};

export type SmsFailure = {
  id: string;
  visit_id: string | null;
  phone_number: string;
  message: string;
  error_message: string | null;
  attempts: number;
  created_at: string;
  review_status: "OPEN" | "REVIEWED" | "DISMISSED";
  review_notes: string | null;
  reviewed_at: string | null;
};

export type AuditEvent = {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SummaryPayload = {
  metrics: {
    active_chws: number;
    tracked_patients: number;
    high_risk_patients: number;
  };
  chws: ChwRow[];
  risk_summary: RiskSummaryRow[];
  heatmap: HeatmapRow[];
};
