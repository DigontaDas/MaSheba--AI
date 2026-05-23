import { OFFLINE_QA_CATEGORIES } from "@/data/offlineQaCategories";
import type { OfflineQa, OfflineQaTrimester } from "@/types/schema";
import { getDB, initDB } from "./database";

type OfflineQaRow = Omit<OfflineQa, "see_doctor" | "emergency"> & {
  see_doctor: number;
  emergency: number;
};

function mapOfflineQa(row: OfflineQaRow): OfflineQa {
  return {
    ...row,
    see_doctor: Boolean(row.see_doctor),
    emergency: Boolean(row.emergency)
  };
}

export function trimesterFromWeeks(weeks: number): OfflineQaTrimester {
  if (weeks >= 1 && weeks <= 13) {
    return "T1";
  }
  if (weeks >= 14 && weeks <= 27) {
    return "T2";
  }
  if (weeks >= 28 && weeks <= 45) {
    return "T3";
  }
  return "ALL";
}

export function getOfflineQaCategories(): readonly string[] {
  return OFFLINE_QA_CATEGORIES;
}

export async function getOfflineQaByTopic(params: {
  topic: string;
  trimester: OfflineQaTrimester;
}): Promise<OfflineQa[]> {
  await initDB();
  const db = await getDB();
  const rows = await db.getAllAsync<OfflineQaRow>(
    `SELECT * FROM offline_qa
     WHERE topic = ? AND trimester IN (?, 'ALL')
     ORDER BY emergency DESC, see_doctor DESC, id ASC`,
    params.topic,
    params.trimester
  );
  return rows.map(mapOfflineQa);
}

export async function getEmergencyOfflineQa(): Promise<OfflineQa[]> {
  await initDB();
  const db = await getDB();
  const rows = await db.getAllAsync<OfflineQaRow>(
    "SELECT * FROM offline_qa WHERE emergency = 1 ORDER BY topic ASC, id ASC"
  );
  return rows.map(mapOfflineQa);
}
