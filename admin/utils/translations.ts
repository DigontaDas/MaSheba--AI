export type Language = "en" | "bn";

export const translations = {
  en: {
    overview: "Overview",
    overview_subtitle: "Live admin summary across CHWs, tracked mothers, risk levels, and upazila density.",
    active_chws: "Active CHWs",
    tracked_patients: "Tracked Patients",
    high_risk_patients: "High Risk Patients",
    chw_list: "CHW List",
    patient_count_by_risk: "Patient Count by Risk Level",
    static_upazila_risk: "Static Upazila Risk Density",
    static_upazila_risk_subtitle: "Local map view, backed by `v_upazila_risk_heatmap`.",
    chw_directory: "CHW Directory Registry",
    chw_directory_desc: "Manage worker lifecycle, active status, union assignment context, and patient counts.",
    tracked_mothers: "Tracked Mothers Registry",
    tracked_mothers_desc: "Search maternal profiles by name, CHW assignment, gestational age, and latest risk level.",
    search_records: "Search records",
    empty_chws: "No CHWs found.",
    empty_patients: "No tracked mothers found.",
    
    // Columns
    col_name: "Name",
    col_union: "Union",
    col_upazila: "Upazila",
    col_patients: "Patients",
    col_mother: "Mother",
    col_age: "Age",
    col_weeks: "Weeks",
    col_chw: "CHW",
    col_risk: "Risk",
    col_updated: "Updated",
    col_status: "Status",
    col_actions: "Actions",

    // Risk Filters & Statuses
    all_risks: "All Risks",
    risk_high: "High",
    risk_moderate: "Moderate",
    risk_low: "Low",
    status_active: "Active",
    status_inactive: "Inactive",
    
    // Subtext
    tap_row_details: "Tap row to view profile details",
    offline: "Offline",
    management_dashboard: "MaSheba AI Management Dashboard",
    operations_workspace: "Operations workspace",
    ops_subtitle: "Maternal health supervision, sync review, and compliance logs",
    logout: "Log out",
  },
  bn: {
    overview: "ওভারভিউ",
    overview_subtitle: "CHW, নিবন্ধিত মা, ঝুঁকির মাত্রা এবং উপজেলা ভিত্তিক ঘনত্বের লাইভ অ্যাডমিন বিবরণ।",
    active_chws: "সক্রিয় CHW",
    tracked_patients: "নিবন্ধিত মা",
    high_risk_patients: "উচ্চ ঝুঁকিপূর্ণ মা",
    chw_list: "স্বাস্থ্যকর্মী তালিকা",
    patient_count_by_risk: "ঝুঁকি স্তর অনুযায়ী মা-দের সংখ্যা",
    static_upazila_risk: "উপজেলা ভিত্তিক ঝুঁকি ঘনত্ব",
    static_upazila_risk_subtitle: "`v_upazila_risk_heatmap` দ্বারা সমর্থিত স্থানীয় মানচিত্র ভিউ।",
    chw_directory: "স্বাস্থ্যকর্মী ডিরেক্টরি রেজিস্ট্রি",
    chw_directory_desc: "স্বাস্থ্যকর্মী লাইফসাইকেল, সক্রিয় অবস্থা, ইউনিয়ন অ্যাসাইনমেন্ট এবং রোগীর সংখ্যা পরিচালনা করুন।",
    tracked_mothers: "নিবন্ধিত মা রেজিস্ট্রি",
    tracked_mothers_desc: "নাম, নির্ধারিত CHW, গর্ভকালীন বয়স সপ্তাহ এবং সর্বশেষ ঝুঁকির স্তর দ্বারা মা-দের তথ্য খুঁজুন।",
    search_records: "তথ্য খুঁজুন",
    empty_chws: "কোনো স্বাস্থ্যকর্মী পাওয়া যায়নি।",
    empty_patients: "কোনো নিবন্ধিত মা পাওয়া যায়নি।",

    // Columns
    col_name: "নাম",
    col_union: "ইউনিয়ন",
    col_upazila: "উপজেলা",
    col_patients: "রোগী সংখ্যা",
    col_mother: "মা",
    col_age: "বয়স",
    col_weeks: "সপ্তাহ",
    col_chw: "CHW",
    col_risk: "ঝুঁকি",
    col_updated: "হালনাগাদ",
    col_status: "অবস্থা",
    col_actions: "কার্যক্রম",

    // Risk Filters & Statuses
    all_risks: "সকল ঝুঁকি",
    risk_high: "উচ্চ",
    risk_moderate: "মাঝারি",
    risk_low: "নিম্ন",
    status_active: "সক্রিয়",
    status_inactive: "নিষ্ক্রিয়",

    // Subtext
    tap_row_details: "বিস্তারিত প্রোফাইল দেখতে ক্লিক করুন",
    offline: "অফলাইন",
    management_dashboard: "মাশীবা এআই ম্যানেজমেন্ট ড্যাশবোর্ড",
    operations_workspace: "অপারেশনস ওয়ার্কস্পেস",
    ops_subtitle: "মাতৃস্বাস্থ্য তত্ত্বাবধান, সিঙ্ক পর্যালোচনা এবং কমপ্লায়েন্স লগ",
    logout: "লগ আউট",
  },
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}

export function formatBilingualChw(name: string): string {
  const norm = name.toUpperCase().trim();
  const chwMap: Record<string, string> = {
    "CHW_A": "CHW_A (রহিমা খাতুন)",
    "CHW_B": "CHW_B (ফাতেমা বেগম)",
    "CHW_C": "CHW_C (তসলিমা)",
    "CHW_D": "CHW_D (সুলতানা)",
    "CHW_E": "CHW_E (হাবিব্বা খাতুন)",
  };
  return chwMap[norm] || name;
}

export function formatBilingualPatient(name: string): string {
  const norm = name.toLowerCase().trim();
  
  if (norm.includes("marium") || norm.includes("মরিয়ম")) {
    return "মরিয়ম বেগম (Marium Begum)";
  }
  if (norm.includes("nurjahan") || norm.includes("নূরজাহান")) {
    return "নূরজাহান আক্তার (Nurjahan)";
  }
  if (norm.includes("ayesha") || norm.includes("আয়েশা")) {
    return "আয়েশা সিদ্দিকা (Ayesha)";
  }
  if (norm.includes("shahana") || norm.includes("শাহানা")) {
    return "মোসাম্মৎ শাহানা";
  }
  if (norm.includes("sultana") || norm.includes("সুলতানা")) {
    return "সুলতানা কামাল (Sultana)";
  }
  if (norm.includes("farida") || norm.includes("ফরিদা")) {
    return "ফরিদা ইয়াসমিন (Farida)";
  }
  if (norm.includes("salma") || norm.includes("সালমা")) {
    return "মোসাঃ সালমা বেগম (Salma Begum)";
  }
  if (norm.includes("shahanaj") || norm.includes("শাহানাজ")) {
    return "শাহানাজ পারভীন (Shahanaj)";
  }
  if (norm.includes("rozina") || norm.includes("রোজিনা")) {
    return "রোজিনা আক্তার (Rozina)";
  }
  if (norm.includes("tania") || norm.includes("তানিয়া")) {
    return "তানিয়া সুলতানা (Tania)";
  }
  if (norm.includes("beauty") || norm.includes("বিউটি")) {
    return "বিউটি আক্তার (Beauty)";
  }
  
  return name;
}
