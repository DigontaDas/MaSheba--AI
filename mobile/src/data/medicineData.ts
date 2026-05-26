import { MEDICINE_INDEX, type MedicineIndexEntry } from "./medicineData.generated";

export interface MedicineSearchResult extends MedicineIndexEntry {
  safetyLevel: "safe" | "caution" | "avoid";
  category: string;
  uses: string[];
  dose: string;
  warnings: string[];
}

const pregnancySafeGenerics = [
  "paracetamol",
  "folic",
  "iron",
  "ferrous",
  "calcium",
  "oral rehydration",
  "ors",
  "doxylamine",
  "pyridoxine"
];

const pregnancyAvoidGenerics = [
  "isotretinoin",
  "warfarin",
  "misoprostol",
  "methotrexate",
  "tetracycline",
  "doxycycline",
  "valproate",
  "ergotamine"
];

function includesAny(value: string, terms: string[]): boolean {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

export function getMedicineSafety(entry: MedicineIndexEntry): MedicineSearchResult["safetyLevel"] {
  const generic = entry.genericName.toLowerCase();
  if (includesAny(generic, pregnancyAvoidGenerics)) return "avoid";
  if (includesAny(generic, pregnancySafeGenerics)) return "safe";
  return "caution";
}

function buildUses(entry: MedicineIndexEntry): string[] {
  const generic = entry.genericName.toLowerCase();
  if (includesAny(generic, ["iron", "ferrous", "folic"])) {
    return ["রক্তশূন্যতা প্রতিরোধ", "গর্ভাবস্থায় আয়রন ও ফলিক অ্যাসিডের চাহিদা পূরণ"];
  }
  if (generic.includes("calcium")) {
    return ["হাড় ও দাঁত মজবুত রাখা", "গর্ভাবস্থায় ক্যালসিয়ামের চাহিদা পূরণ"];
  }
  if (generic.includes("paracetamol") || generic.includes("acetaminophen")) {
    return ["জ্বর কমানো", "হালকা ব্যথা কমানো"];
  }
  if (generic.includes("oral rehydration") || generic.includes("ors")) {
    return ["ডায়রিয়া বা বমির পর পানিশূন্যতা রোধ"];
  }
  return [`জেনেরিক: ${entry.genericName}`];
}

function buildWarnings(entry: MedicineIndexEntry, safetyLevel: MedicineSearchResult["safetyLevel"]): string[] {
  if (safetyLevel === "avoid") {
    return ["গর্ভাবস্থায় এই ওষুধ ঝুঁকিপূর্ণ হতে পারে", "ডাক্তারের সরাসরি পরামর্শ ছাড়া ব্যবহার করবেন না"];
  }
  if (safetyLevel === "safe") {
    return ["নির্ধারিত মাত্রা মেনে চলুন", "অস্বস্তি হলে স্বাস্থ্যকর্মী বা ডাক্তারের সাথে কথা বলুন"];
  }
  return ["গর্ভাবস্থায় ব্যবহারের আগে ডাক্তার বা স্বাস্থ্যকর্মীর পরামর্শ নিন", "মাত্রা ও সময়সূচি নিজে পরিবর্তন করবেন না"];
}

export function enrichMedicine(entry: MedicineIndexEntry): MedicineSearchResult {
  const safetyLevel = getMedicineSafety(entry);
  return {
    ...entry,
    safetyLevel,
    category: entry.dosageForm || entry.type || "Medicine",
    uses: buildUses(entry),
    dose: entry.strength ? `${entry.strength} (${entry.dosageForm || "ফর্ম উল্লেখ নেই"})` : "ডাক্তারের পরামর্শ অনুযায়ী",
    warnings: buildWarnings(entry, safetyLevel)
  };
}

export function searchMedicines(query: string, limit = 30): MedicineSearchResult[] {
  const q = query.trim().toLowerCase();
  const source = q.length
    ? MEDICINE_INDEX.filter((entry) =>
        entry.brandName.toLowerCase().includes(q) ||
        entry.genericName.toLowerCase().includes(q) ||
        entry.dosageForm.toLowerCase().includes(q) ||
        entry.manufacturer.toLowerCase().includes(q)
      )
    : MEDICINE_INDEX.slice(0, limit);

  return source.slice(0, limit).map(enrichMedicine);
}

export const MEDICINE_SOURCE_LABEL = "Extra_docs_Useful/Medicine_dataset/medicine.csv";
