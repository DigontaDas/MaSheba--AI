import type { Patient, RiskPrediction, Visit, VisitInput } from "@/types/schema";
import { createIdempotencyKey, createUuid } from "@/utils/ids";
import { nowIso } from "@/utils/time";
import { getDB, initDB } from "./database";

export async function insertVisit(params: {
  patient: Patient;
  chwId: string;
  deviceId: string;
  input: VisitInput;
  prediction: RiskPrediction;
}): Promise<{ visit: Visit; idempotency_key: string }> {
  await initDB();
  const db = await getDB();
  const visitId = createUuid();
  const createdAt = nowIso();
  const visitedAt = createdAt;
  const idempotencyKey = createIdempotencyKey(params.deviceId);
  const symptomFlags = JSON.stringify(params.input.symptom_flags ?? {});
  const payload = {
    chw_id: params.chwId,
    patient_id: params.patient.id,
    visit_id: visitId,
    patient: {
      name: params.patient.name,
      age: params.patient.age,
      gestational_age_weeks: params.patient.gestational_age_weeks,
      last_risk_level: params.prediction.risk_level
    },
    bp_systolic: params.input.bp_systolic,
    bp_diastolic: params.input.bp_diastolic,
    weight_kg: params.input.weight_kg,
    hemoglobin: params.input.hemoglobin,
    swelling_present: params.input.swelling_present,
    symptom_flags: params.input.symptom_flags,
    risk_level: params.prediction.risk_level,
    visited_at: visitedAt
  };

  const visit: Visit = {
    id: visitId,
    patient_id: params.patient.id,
    chw_id: params.chwId,
    bp_systolic: params.input.bp_systolic,
    bp_diastolic: params.input.bp_diastolic,
    weight_kg: params.input.weight_kg,
    hemoglobin: params.input.hemoglobin,
    swelling_present: params.input.swelling_present,
    symptom_flags: params.input.symptom_flags,
    risk_level: params.prediction.risk_level,
    visited_at: visitedAt,
    device_id: params.deviceId,
    created_at: createdAt
  };

  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT INTO visits (
        id, patient_id, chw_id, bp_systolic, bp_diastolic, weight_kg, hemoglobin,
        swelling_present, symptom_flags, risk_level, visited_at, device_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      visit.id,
      visit.patient_id,
      visit.chw_id,
      visit.bp_systolic,
      visit.bp_diastolic,
      visit.weight_kg,
      visit.hemoglobin,
      visit.swelling_present ? 1 : 0,
      symptomFlags,
      visit.risk_level,
      visit.visited_at,
      visit.device_id,
      visit.created_at
    );
    await tx.runAsync(
      "UPDATE patients SET last_risk_level = ?, updated_at = ? WHERE id = ?",
      params.prediction.risk_level,
      createdAt,
      params.patient.id
    );
    await tx.runAsync(
      `INSERT INTO outbox_events (
        idempotency_key, chw_id, device_id, event_type, payload, status, created_at
      ) VALUES (?, ?, ?, 'visit_create', ?, 'PENDING', ?)`,
      idempotencyKey,
      params.chwId,
      params.deviceId,
      JSON.stringify(payload),
      createdAt
    );
  });

  return { visit, idempotency_key: idempotencyKey };
}
