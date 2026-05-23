export const OFFLINE_QA_CATEGORIES = [
  "গর্ভাবস্থার লক্ষণ",
  "উচ্চ রক্তচাপ",
  "সংক্রমণ",
  "বমি বমি ভাব",
  "পুষ্টি ও খাবার",
  "ব্যথা ও অস্বস্তি",
  "জরুরি লক্ষণ",
  "রক্তশূন্যতা",
  "শিশুর নড়াচড়া",
  "প্রসবের লক্ষণ",
  "প্রসব পরবর্তী যত্ন",
  "বুকের দুধ"
] as const;

export type OfflineQaCategory = (typeof OFFLINE_QA_CATEGORIES)[number];
