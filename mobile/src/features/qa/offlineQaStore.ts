import { OFFLINE_QA_CATEGORIES } from "@/data/offlineQaCategories";
import { getDB } from "@/db/database";
import { getLocalDbErrorMessage, runLocalDb } from "@/db/localDbAccess";
import type { OfflineQa, OfflineQaTrimester } from "@/types/schema";

type OfflineQaRow = Omit<OfflineQa, "see_doctor" | "emergency"> & {
  see_doctor: number;
  emergency: number;
};

export type QaCategory = {
  label: string;
  topic: string;
};

function mapOfflineQa(row: OfflineQaRow): OfflineQa {
  return {
    ...row,
    see_doctor: Boolean(row.see_doctor),
    emergency: Boolean(row.emergency)
  };
}

export function getQaCategories(): QaCategory[] {
  return OFFLINE_QA_CATEGORIES.map((label) => ({
    label,
    topic: label.replace(/\s+/g, "_")
  }));
}

export async function getQaByTopic(params: {
  topic: string;
  trimester: OfflineQaTrimester;
}): Promise<OfflineQa[]> {
  try {
    return await runLocalDb(async () => {
      const db = await getDB();
      const rows = await db.getAllAsync<OfflineQaRow>(
        `SELECT * FROM offline_qa
         WHERE topic = ? AND trimester IN (?, 'ALL')
         ORDER BY emergency DESC, see_doctor DESC, id ASC`,
        params.topic,
        params.trimester
      );
      return rows.map(mapOfflineQa);
    });
  } catch (error) {
    throw new Error(getLocalDbErrorMessage(error));
  }
}

function normalizeKeywords(question: string): string[] {
  return question
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[.,!?।,:;()[\]{}"'`]/g, ""))
    .filter((part) => part.length >= 2);
}

export async function searchQa(question: string, trimester: OfflineQaTrimester): Promise<OfflineQa[]> {
  const keywords = normalizeKeywords(question);
  if (!keywords.length) {
    return [];
  }

  try {
    return await runLocalDb(async () => {
      const db = await getDB();
      const likeClauses = keywords.flatMap(() => ["question_bn LIKE ?", "answer_bn LIKE ?"]).join(" OR ");
      const bindings = keywords.flatMap((keyword) => [`%${keyword}%`, `%${keyword}%`]);
      const rows = await db.getAllAsync<OfflineQaRow>(
        `SELECT * FROM offline_qa
         WHERE trimester IN (?, 'ALL')
           AND (${likeClauses})
         ORDER BY emergency DESC, see_doctor DESC, id ASC
         LIMIT 5`,
        trimester,
        ...bindings
      );
      return rows.map(mapOfflineQa);
    });
  } catch (error) {
    throw new Error(getLocalDbErrorMessage(error));
  }
}
