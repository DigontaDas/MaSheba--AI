import { getDB } from "./database";
import { runLocalDb } from "./localDbAccess";
import type { Patient, RiskLevel } from "@/types/schema";
import { nowIso } from "@/utils/time";

type PatientRow = Omit<Patient, "last_risk_level"> & {
  last_risk_level: string;
};

function mapPatient(row: PatientRow): Patient {
  return {
    ...row,
    last_risk_level: row.last_risk_level as RiskLevel
  };
}

export async function upsertPatients(patients: Patient[]): Promise<void> {
  await runLocalDb(async () => {
    const db = await getDB();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const patient of patients) {
        await tx.runAsync(
          `INSERT INTO patients (
          id, chw_id, name, age, gestational_age_weeks, last_risk_level, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          chw_id = excluded.chw_id,
          name = excluded.name,
          age = excluded.age,
          gestational_age_weeks = excluded.gestational_age_weeks,
          last_risk_level = excluded.last_risk_level,
          updated_at = excluded.updated_at`,
          patient.id,
          patient.chw_id,
          patient.name,
          patient.age,
          patient.gestational_age_weeks,
          patient.last_risk_level,
          patient.created_at,
          patient.updated_at
        );
      }
    });
  });
}

export async function getPatients(): Promise<Patient[]> {
  return runLocalDb(async () => {
    const db = await getDB();
    const rows = await db.getAllAsync<PatientRow>(
      "SELECT * FROM patients ORDER BY updated_at DESC, name ASC"
    );
    return rows.map(mapPatient);
  });
}

export async function getPatient(patientId: string): Promise<Patient | null> {
  return runLocalDb(async () => {
    const db = await getDB();
    const row = await db.getFirstAsync<PatientRow>("SELECT * FROM patients WHERE id = ?", patientId);
    return row ? mapPatient(row) : null;
  });
}

export async function updatePatientRisk(patientId: string, riskLevel: RiskLevel): Promise<void> {
  await runLocalDb(async () => {
    const db = await getDB();
    await db.runAsync(
      "UPDATE patients SET last_risk_level = ?, updated_at = ? WHERE id = ?",
      riskLevel,
      nowIso(),
      patientId
    );
  });
}
