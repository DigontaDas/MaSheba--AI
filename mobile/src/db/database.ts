import * as SQLite from "expo-sqlite";
import { OFFLINE_QA_SEED } from "@/data/offlineQaSeed.bn";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= SQLite.openDatabaseAsync("maasheba.db");
  return dbPromise;
}

export async function initDB(): Promise<void> {
  const db = await getDB();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY NOT NULL,
      chw_id TEXT NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL CHECK (age BETWEEN 10 AND 60),
      gestational_age_weeks INTEGER NOT NULL CHECK (gestational_age_weeks BETWEEN 1 AND 45),
      last_risk_level TEXT NOT NULL CHECK (last_risk_level IN ('LOW', 'MODERATE', 'HIGH')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY NOT NULL,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
      chw_id TEXT NOT NULL,
      bp_systolic INTEGER NOT NULL CHECK (bp_systolic BETWEEN 60 AND 260),
      bp_diastolic INTEGER NOT NULL CHECK (bp_diastolic BETWEEN 30 AND 180),
      weight_kg REAL NOT NULL CHECK (weight_kg BETWEEN 25 AND 200),
      hemoglobin REAL NOT NULL CHECK (hemoglobin BETWEEN 3 AND 20),
      swelling_present INTEGER NOT NULL DEFAULT 0,
      symptom_flags TEXT NOT NULL DEFAULT '{}',
      risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH')),
      visited_at TEXT NOT NULL,
      device_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS outbox_events (
      idempotency_key TEXT PRIMARY KEY NOT NULL,
      chw_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('patient_upsert', 'visit_create')),
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SYNCED', 'DUPLICATE', 'FAILED')),
      error_message TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_qa (
      id TEXT PRIMARY KEY NOT NULL,
      trimester TEXT NOT NULL CHECK (trimester IN ('T1','T2','T3','POSTPARTUM','ALL')),
      week_range TEXT NOT NULL,
      topic TEXT NOT NULL,
      question_bn TEXT NOT NULL,
      answer_bn TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('LOW','MODERATE','HIGH')),
      see_doctor INTEGER NOT NULL DEFAULT 0,
      emergency INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS patients_chw_id_idx ON patients(chw_id);
    CREATE INDEX IF NOT EXISTS patients_risk_idx ON patients(last_risk_level);
    CREATE INDEX IF NOT EXISTS visits_patient_id_idx ON visits(patient_id);
    CREATE INDEX IF NOT EXISTS outbox_status_idx ON outbox_events(status);
    CREATE INDEX IF NOT EXISTS offline_qa_topic_trimester_idx ON offline_qa(topic, trimester);
    CREATE INDEX IF NOT EXISTS offline_qa_emergency_idx ON offline_qa(emergency);
    CREATE INDEX IF NOT EXISTS offline_qa_severity_idx ON offline_qa(severity);
  `);

  // Prevent database write wear by only inserting guidelines if the table is empty
  const countResult = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM offline_qa"
  );

  if (countResult && countResult.count > 0) {
    return;
  }

  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const item of OFFLINE_QA_SEED) {
      await tx.runAsync(
        `INSERT OR REPLACE INTO offline_qa (
          id, trimester, week_range, topic, question_bn, answer_bn, severity, see_doctor, emergency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.id,
        item.trimester,
        item.week_range,
        item.topic,
        item.question_bn,
        item.answer_bn,
        item.severity,
        item.see_doctor ? 1 : 0,
        item.emergency ? 1 : 0
      );
    }
  });
}
