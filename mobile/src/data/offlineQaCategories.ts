import type { Language } from "@/context/LanguageContext";

export type OfflineQaCategoryDefinition = {
  id: string;
  topic: string;
  label: Record<Language, string>;
};

export const OFFLINE_QA_CATEGORIES: OfflineQaCategoryDefinition[] = [
  { id: "pregnancy_symptoms", topic: "গর্ভাবস্থার_লক্ষণ", label: { bn: "গর্ভাবস্থার লক্ষণ", en: "Pregnancy symptoms" } },
  { id: "high_blood_pressure", topic: "উচ্চ_রক্তচাপ", label: { bn: "উচ্চ রক্তচাপ", en: "High blood pressure" } },
  { id: "infection", topic: "সংক্রমণ", label: { bn: "সংক্রমণ", en: "Infection" } },
  { id: "nausea", topic: "বমি_বমি_ভাব", label: { bn: "বমি বমি ভাব", en: "Nausea and vomiting" } },
  { id: "nutrition", topic: "পুষ্টি_ও_খাবার", label: { bn: "পুষ্টি ও খাবার", en: "Nutrition and food" } },
  { id: "pain_discomfort", topic: "ব্যথা_ও_অস্বস্তি", label: { bn: "ব্যথা ও অস্বস্তি", en: "Pain and discomfort" } },
  { id: "danger_signs", topic: "জরুরি_লক্ষণ", label: { bn: "জরুরি লক্ষণ", en: "Danger signs" } },
  { id: "anemia", topic: "রক্তশূন্যতা", label: { bn: "রক্তশূন্যতা", en: "Anemia" } },
  { id: "fetal_movement", topic: "শিশুর_নড়াচড়া", label: { bn: "শিশুর নড়াচড়া", en: "Baby movement" } },
  { id: "labour_signs", topic: "প্রসবের_লক্ষণ", label: { bn: "প্রসবের লক্ষণ", en: "Labour signs" } },
  { id: "postpartum_care", topic: "প্রসব_পরবর্তী_যত্ন", label: { bn: "প্রসব পরবর্তী যত্ন", en: "Postpartum care" } },
  { id: "breastfeeding", topic: "বুকের_দুধ", label: { bn: "বুকের দুধ", en: "Breastfeeding" } }
] as const;

export type OfflineQaCategory = (typeof OFFLINE_QA_CATEGORIES)[number];
