export type RiskLevel = "LOW" | "MODERATE" | "HIGH";

export type ChwRow = {
  chw_id: string;
  name: string;
  union_name: string;
  upazila: string;
  district?: string | null;
  is_active: boolean;
  patient_count: number;
  verification_status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason?: string | null;
  created_at?: string;
  organization_name?: string | null;
  worker_type?: string | null;
  years_of_experience?: number;
  certificate_url?: string | null;
};

export type PendingChwRow = {
  id: string;
  name: string;
  union_name: string;
  upazila: string;
  district?: string | null;
  organization_name: string | null;
  worker_type: string | null;
  years_of_experience: number;
  certificate_url: string | null;
  verification_status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
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

export type MotherRegistryRow = {
  id: string;
  auth_user_id: string;
  name: string;
  phone: string | null;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  patient_id: string | null;
  chw_id: string | null;
  chw_name: string | null;
  age: number | null;
  gestational_age_weeks: number | null;
  last_risk_level: RiskLevel | null;
  link_status: "LINKED" | "UNLINKED";
  location?: any;
  created_at: string;
  updated_at: string;
};

export type PatientRow = MotherRegistryRow;

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

export type ConnectionRequest = {
  id: string;
  mother_id: string;
  mother_name: string;
  status: "pending" | "assigned" | "active" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  lat: number | null;
  lng: number | null;
  assigned_chw_name?: string | null;
};
