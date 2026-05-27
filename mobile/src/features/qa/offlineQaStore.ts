import type { Language } from "@/context/LanguageContext";
import { OFFLINE_QA_CATEGORIES } from "@/data/offlineQaCategories";
import { OFFLINE_QA_SEED_EN } from "@/data/offlineQaSeed.en";
import { getDB } from "@/db/database";
import { getLocalDbErrorMessage, runLocalDb } from "@/db/localDbAccess";
import type { OfflineQa, OfflineQaTrimester } from "@/types/schema";

type OfflineQaRow = Omit<OfflineQa, "see_doctor" | "emergency"> & {
  see_doctor: number;
  emergency: number;
};

export type QaCategory = {
  id: string;
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

export function getQaCategories(language: Language = "bn"): QaCategory[] {
  return OFFLINE_QA_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label[language],
    topic: category.topic
  }));
}

function matchesTrimester(item: OfflineQa, trimester: OfflineQaTrimester): boolean {
  return item.trimester === trimester || item.trimester === "ALL";
}

function sortQaRows(a: OfflineQa, b: OfflineQa): number {
  if (a.emergency !== b.emergency) return a.emergency ? -1 : 1;
  if (a.see_doctor !== b.see_doctor) return a.see_doctor ? -1 : 1;
  return a.id.localeCompare(b.id);
}

export async function getQaByTopic(params: {
  topic: string;
  trimester: OfflineQaTrimester;
  language?: Language;
}): Promise<OfflineQa[]> {
  if (params.language === "en") {
    return OFFLINE_QA_SEED_EN.filter((item) => item.topic === params.topic && matchesTrimester(item, params.trimester)).sort(sortQaRows);
  }

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

export async function searchQa(question: string, trimester: OfflineQaTrimester, language: Language = "bn"): Promise<OfflineQa[]> {
  const keywords = normalizeKeywords(question);
  if (!keywords.length) {
    return [];
  }

  if (language === "en") {
    const lowerKeywords = keywords.map((keyword) => keyword.toLowerCase());
    return OFFLINE_QA_SEED_EN.filter(
      (item) =>
        matchesTrimester(item, trimester) &&
        lowerKeywords.some((keyword) => `${item.question_bn} ${item.answer_bn}`.toLowerCase().includes(keyword))
    )
      .sort(sortQaRows)
      .slice(0, 5);
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
