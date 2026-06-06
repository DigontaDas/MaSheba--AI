export type Language = "en" | "bn";

export const translations = {
  en: {
    overview: "Overview",
    overview_subtitle: "Live admin summary across CHWs, tracked mothers, risk levels, and upazila density.",
    active_chws: "Active CHWs",
    tracked_patients: "Tracked Mothers",
    high_risk_patients: "High Risk Mothers",
    chw_list: "CHW List",
    patient_count_by_risk: "Mother Count by Risk Level",
    static_upazila_risk: "Static Upazila Risk Density",
    static_upazila_risk_subtitle: "Local map view, backed by `v_upazila_risk_heatmap`.",
    chw_directory: "CHW Directory Registry",
    chw_directory_desc: "Manage worker lifecycle, active status, union assignment context, and patient counts.",
    tracked_mothers: "Tracked Mothers Registry",
    tracked_mothers_desc: "Search registered mothers by name, phone, CHW linkage, verification status, and latest risk level.",
    search_records: "Search records",
    empty_chws: "No CHWs found.",
    empty_patients: "No tracked mothers found.",
    col_name: "Name",
    col_union: "Union",
    col_upazila: "Upazila",
    col_patients: "Mothers",
    col_mother: "Mother",
    col_age: "Age",
    col_weeks: "Weeks",
    col_chw: "CHW / Link",
    col_risk: "Risk",
    col_updated: "Updated",
    col_status: "Status",
    col_actions: "Actions",
    all_risks: "All Risks",
    risk_high: "High",
    risk_moderate: "Moderate",
    risk_low: "Low",
    status_active: "Active",
    status_inactive: "Inactive",
    tap_row_details: "Tap row to view profile details",
    offline: "Offline",
    online: "Online",
    management_dashboard: "MaSheba AI Management Dashboard",
    operations_workspace: "Operations workspace",
    ops_subtitle: "Maternal health supervision, sync review, and compliance logs",
    logout: "Log out",
  },
};

export function getTranslation(_lang: Language) {
  return translations.en;
}

export function formatBilingualChw(name: string): string {
  return name;
}

export function formatBilingualPatient(name: string): string {
  return name;
}
