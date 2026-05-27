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

function buildUses(entry: MedicineIndexEntry, language: "bn" | "en" = "bn"): string[] {
  const generic = entry.genericName.toLowerCase();
  if (language === "en") {
    if (includesAny(generic, ["iron", "ferrous", "folic"])) {
      return ["Anemia prevention", "Meet iron & folic acid needs during pregnancy"];
    }
    if (generic.includes("calcium")) {
      return ["Strengthen bones & teeth", "Meet calcium needs during pregnancy"];
    }
    if (generic.includes("paracetamol") || generic.includes("acetaminophen")) {
      return ["Fever reduction", "Mild pain relief"];
    }
    if (generic.includes("oral rehydration") || generic.includes("ors")) {
      return ["Dehydration prevention after diarrhea or vomiting"];
    }
    return [`Generic: ${entry.genericName}`];
  } else {
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
}

function buildWarnings(entry: MedicineIndexEntry, safetyLevel: MedicineSearchResult["safetyLevel"], language: "bn" | "en" = "bn"): string[] {
  if (language === "en") {
    if (safetyLevel === "avoid") {
      return ["This medicine is risky during pregnancy", "Do not use without doctor's direct advice"];
    }
    if (safetyLevel === "safe") {
      return ["Follow prescribed dosage", "Talk to a health worker or doctor if discomfort occurs"];
    }
    return ["Consult doctor or health worker before using during pregnancy", "Do not change dose or schedule by yourself"];
  } else {
    if (safetyLevel === "avoid") {
      return ["গর্ভাবস্থায় এই ওষুধ ঝুঁকিপূর্ণ হতে পারে", "ডাক্তারের সরাসরি পরামর্শ ছাড়া ব্যবহার করবেন না"];
    }
    if (safetyLevel === "safe") {
      return ["নির্ধারিত মাত্রা মেনে চলুন", "অস্বস্তি হলে স্বাস্থ্যকর্মী বা ডাক্তারের সাথে কথা বলুন"];
    }
    return ["গর্ভাবস্থায় ব্যবহারের আগে ডাক্তার বা স্বাস্থ্যকর্মীর পরামর্শ নিন", "মাত্রা ও সময়সূচি নিজে পরিবর্তন করবেন না"];
  }
}

export function enrichMedicine(entry: MedicineIndexEntry, language: "bn" | "en" = "bn"): MedicineSearchResult {
  const safetyLevel = getMedicineSafety(entry);
  return {
    ...entry,
    safetyLevel,
    category: entry.dosageForm || entry.type || (language === "en" ? "Medicine" : "ওষুধ"),
    uses: buildUses(entry, language),
    dose: entry.strength 
      ? `${entry.strength} (${entry.dosageForm || (language === "en" ? "Form not specified" : "ফর্ম উল্লেখ নেই")})` 
      : (language === "en" ? "As advised by doctor" : "ডাক্তারের পরামর্শ অনুযায়ী"),
    warnings: buildWarnings(entry, safetyLevel, language)
  };
}

export function searchMedicines(query: string, limit = 30, language: "bn" | "en" = "bn"): MedicineSearchResult[] {
  const q = query.trim().toLowerCase();
  const source = q.length
    ? MEDICINE_INDEX.filter((entry) =>
        entry.brandName.toLowerCase().includes(q) ||
        entry.genericName.toLowerCase().includes(q) ||
        entry.dosageForm.toLowerCase().includes(q) ||
        entry.manufacturer.toLowerCase().includes(q)
      )
    : MEDICINE_INDEX.slice(0, limit);

  return source.slice(0, limit).map((entry) => enrichMedicine(entry, language));
}

export const MEDICINE_SOURCE_LABEL = "Extra_docs_Useful/Medicine_dataset/medicine.csv";
