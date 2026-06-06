import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  Linking,
  Alert
} from "react-native";
import { router } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { supabase } from "@/auth/supabaseAuth";
import { clearRoleSession } from "@/auth/roleSession";
import { clearSession, getSession } from "@/auth/secureSession";
import { useLanguage } from "@/context/LanguageContext";
import { colors, radius, spacing, typography } from "@/theme";

const { width } = Dimensions.get("window");
const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://maasheba-backend.onrender.com").replace(/\/+$/, "");

type ChwListRow = {
  chw_id: string;
  name: string;
  union_name: string;
  upazila: string;
  is_active: boolean;
  patient_count: number;
};

type RiskSummaryRow = {
  chw_id: string;
  chw_name: string;
  low_count: number;
  moderate_count: number;
  high_count: number;
};

type PatientRow = {
  id: string;
  chw_id: string;
  name: string;
  age: number;
  gestational_age_weeks: number;
  last_risk_level: "LOW" | "MODERATE" | "HIGH";
};

type PendingChwRow = {
  id: string;
  name: string;
  union_name: string | null;
  upazila: string | null;
  organization_name: string | null;
  worker_type: string | null;
  years_of_experience: number | null;
  certificate_url: string | null;
  verification_status: "PENDING" | "APPROVED" | "REJECTED";
};

async function adminApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = await getSession();
  if (!session?.accessToken) {
    throw new Error("Admin session is required.");
  }
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || payload?.detail || `Admin request failed with HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

// Seeded offline demo fallback data
// Seeded offline demo fallback data
const SEEDED_CHWS: ChwListRow[] = [
  {
    chw_id: "chw-a",
    name: "CHW_A (রহিমা খাতুন)",
    union_name: "Shibpur Union",
    upazila: "Narsingdi Sadar",
    is_active: true,
    patient_count: 6
  },
  {
    chw_id: "chw-b",
    name: "CHW_B (ফাতেমা বেগম)",
    union_name: "Palash Union",
    upazila: "Palash",
    is_active: true,
    patient_count: 0
  },
  {
    chw_id: "chw-c",
    name: "CHW_C (তসলিমা আক্তার)",
    union_name: "Putia Union",
    upazila: "Shibpur",
    is_active: true,
    patient_count: 3
  },
  {
    chw_id: "chw-d",
    name: "CHW_D (সুলতানা পারভীন)",
    union_name: "Radhanagar Union",
    upazila: "Raipura",
    is_active: true,
    patient_count: 2
  },
  {
    chw_id: "chw-e",
    name: "CHW_E (হাবিবা খাতুন)",
    union_name: "Adiabad Union",
    upazila: "Raipura",
    is_active: false,
    patient_count: 0
  }
];

const SEEDED_RISK_SUMMARY: RiskSummaryRow[] = [
  {
    chw_id: "chw-a",
    chw_name: "CHW_A",
    low_count: 3,
    moderate_count: 2,
    high_count: 1
  },
  {
    chw_id: "chw-b",
    chw_name: "CHW_B",
    low_count: 0,
    moderate_count: 0,
    high_count: 0
  },
  {
    chw_id: "chw-c",
    chw_name: "CHW_C",
    low_count: 2,
    moderate_count: 1,
    high_count: 0
  },
  {
    chw_id: "chw-d",
    chw_name: "CHW_D",
    low_count: 1,
    moderate_count: 0,
    high_count: 1
  },
  {
    chw_id: "chw-e",
    chw_name: "CHW_E",
    low_count: 0,
    moderate_count: 0,
    high_count: 0
  }
];

const SEEDED_PATIENTS: PatientRow[] = [
  {
    id: "patient-1",
    chw_id: "chw-a",
    name: "মরিয়ম বেগম (Marium Begum)",
    age: 24,
    gestational_age_weeks: 32,
    last_risk_level: "HIGH"
  },
  {
    id: "patient-2",
    chw_id: "chw-a",
    name: "নূরজাহান আক্তার (Nurjahan)",
    age: 28,
    gestational_age_weeks: 24,
    last_risk_level: "MODERATE"
  },
  {
    id: "patient-3",
    chw_id: "chw-a",
    name: "আয়েশা সিদ্দিকা (Ayesha)",
    age: 22,
    gestational_age_weeks: 16,
    last_risk_level: "LOW"
  },
  {
    id: "patient-4",
    chw_id: "chw-a",
    name: "মোসাম্মৎ শাহানা (Shahana)",
    age: 30,
    gestational_age_weeks: 36,
    last_risk_level: "LOW"
  },
  {
    id: "patient-5",
    chw_id: "chw-a",
    name: "সুলতানা কামাল (Sultana)",
    age: 26,
    gestational_age_weeks: 20,
    last_risk_level: "LOW"
  },
  {
    id: "patient-6",
    chw_id: "chw-a",
    name: "ফরিদা ইয়াসমিন (Farida)",
    age: 29,
    gestational_age_weeks: 28,
    last_risk_level: "MODERATE"
  },
  {
    id: "patient-7",
    chw_id: "chw-c",
    name: "মোসাঃ সালমা বেগম (Salma Begum)",
    age: 25,
    gestational_age_weeks: 20,
    last_risk_level: "LOW"
  },
  {
    id: "patient-8",
    chw_id: "chw-c",
    name: "শাহানাজ পারভীন (Shahanaj)",
    age: 27,
    gestational_age_weeks: 28,
    last_risk_level: "MODERATE"
  },
  {
    id: "patient-9",
    chw_id: "chw-c",
    name: "রোজিনা আক্তার (Rozina)",
    age: 23,
    gestational_age_weeks: 12,
    last_risk_level: "LOW"
  },
  {
    id: "patient-10",
    chw_id: "chw-d",
    name: "তানিয়া সুলতানা (Tania)",
    age: 22,
    gestational_age_weeks: 30,
    last_risk_level: "HIGH"
  },
  {
    id: "patient-11",
    chw_id: "chw-d",
    name: "বিউটি আক্তার (Beauty)",
    age: 29,
    gestational_age_weeks: 24,
    last_risk_level: "LOW"
  }
];

const translations = {
  bn: {
    title: "অ্যাডমিন প্যানেল",
    subtitle: "মাসেবা AI পরিচালনা ড্যাশবোর্ড",
    activeChws: "সক্রিয় স্বাস্থ্যকর্মী",
    trackedPatients: "নিবন্ধিত গর্ভবতী মা",
    highRiskPatients: "উচ্চ ঝুঁকিপূর্ণ মা",
    chwList: "স্বাস্থ্যকর্মী তালিকা",
    patientList: "গর্ভবতী মায়ের তালিকা",
    riskLevel: "ঝুঁকির মাত্রা অনুযায়ী বিশ্লেষণ",
    low: "কম ঝুঁকি",
    moderate: "মাঝারি ঝুঁকি",
    high: "উচ্চ ঝুঁকি",
    name: "নাম",
    union: "ইউনিয়ন",
    upazila: "উপজেলা",
    patients: "রোগী সংখ্যা",
    logout: "লগ আউট",
    syncStatus: "ডাটাবেস সিঙ্ক সক্রিয় ⚡",
    offlineStatus: "অফলাইন ডেমো মোড 📶",
    loading: "লোডিং...",
    chwTab: "স্বাস্থ্যকর্মী",
    patientTab: "গর্ভবতী মা",
    age: "বয়স",
    weeks: "সপ্তাহ",
    risk: "ঝুঁকি",
    assignedChw: "স্বাস্থ্যকর্মী",
    years: "বছর",
    searchPlaceholder: "নাম বা এলাকা দিয়ে খুঁজুন...",
    filterAll: "সব ঝুঁকি",
    filterHigh: "উচ্চ ঝুঁকি",
    filterMod: "মাঝারি",
    filterLow: "কম ঝুঁকি",
    clearFilter: "ফিল্টার মুছুন ✕",
    detailsTitle: "বিস্তারিত বিবরণ",
    patientName: "মায়ের নাম:",
    ageText: "বয়স:",
    gestationText: "গর্ভকাল (সপ্তাহ):",
    chwName: "দায়িত্বপ্রাপ্ত স্বাস্থ্যকর্মী:",
    statusLabel: "অবস্থা:",
    unionLabel: "ইউনিয়ন:",
    upazilaLabel: "উপজেলা:",
    activeText: "সক্রিয়",
    inactiveText: "নিষ্ক্রিয়",
    patientCountText: "মোট রোগী সংখ্যা:",
    closeBtn: "বন্ধ করুন",
    chwDetailTitle: "স্বাস্থ্যকর্মীর বিবরণ",
    patientDetailTitle: "গর্ভবতী মায়ের বিবরণ",
    clickRowToView: "বিস্তারিত দেখতে লাইনে চাপুন ℹ️",
    activeLabel: "অবস্থা",
    chwPatientsFilterBtn: "রোগী তালিকা ফিল্টার করুন 🔍"
  },
  en: {
    title: "Admin Panel",
    subtitle: "MaSheba AI Management Dashboard",
    activeChws: "Active CHWs",
    trackedPatients: "Tracked Patients",
    highRiskPatients: "High Risk Patients",
    chwList: "CHW Directory Registry",
    patientList: "Tracked Mothers Registry",
    riskLevel: "Pregnancy Risk Analysis",
    low: "Low Risk",
    moderate: "Moderate Risk",
    high: "High Risk",
    name: "Name",
    union: "Union",
    upazila: "Upazila",
    patients: "Patients",
    logout: "Log Out",
    syncStatus: "Database Sync Active ⚡",
    offlineStatus: "Offline Demo Mode 📶",
    loading: "Loading...",
    chwTab: "Health Workers",
    patientTab: "Pregnant Mothers",
    age: "Age",
    weeks: "Weeks",
    risk: "Risk",
    assignedChw: "Assigned CHW",
    years: "yrs",
    searchPlaceholder: "Search name, union, upazila...",
    filterAll: "All Risks",
    filterHigh: "High",
    filterMod: "Moderate",
    filterLow: "Low",
    clearFilter: "Clear Filter ✕",
    detailsTitle: "Detailed Records",
    patientName: "Mother's Name:",
    ageText: "Age:",
    gestationText: "Gestational Age:",
    chwName: "Assigned Health Worker:",
    statusLabel: "Status:",
    unionLabel: "Union:",
    upazilaLabel: "Upazila:",
    activeText: "Active",
    inactiveText: "Inactive",
    patientCountText: "Total Patients:",
    closeBtn: "Close",
    chwDetailTitle: "CHW Profile Details",
    patientDetailTitle: "Maternal Health Profile",
    clickRowToView: "Tap row to view profile details ℹ️",
    activeLabel: "Status",
    chwPatientsFilterBtn: "Filter Patient List 🔍"
  }
};

export default function AdminDashboardScreen() {
  const { language: lang, setLanguage } = useLanguage();
  const [chws, setChws] = useState<ChwListRow[]>(SEEDED_CHWS);
  const [riskSummary, setRiskSummary] = useState<RiskSummaryRow[]>(SEEDED_RISK_SUMMARY);
  const [patients, setPatients] = useState<PatientRow[]>(SEEDED_PATIENTS);
  const [activeTab, setActiveTab] = useState<"chws" | "patients" | "verifications">("chws");
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Advanced search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<"ALL" | "HIGH" | "MODERATE" | "LOW">("ALL");
  const [selectedChwFilter, setSelectedChwFilter] = useState<string | null>(null);
  
  // Interactive Modal states
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);
  const [selectedChw, setSelectedChw] = useState<ChwListRow | null>(null);

  // Verification states
  const [pendingChws, setPendingChws] = useState<PendingChwRow[]>([]);
  const [pendingChwError, setPendingChwError] = useState<string | null>(null);
  const [rejectingChwId, setRejectingChwId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);

  const t = translations[lang];

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      // Attempt to fetch from Supabase
      const [chwRes, riskRes, patientRes, pendingChwsRes] = await Promise.all([
        supabase.from("v_chw_list").select("chw_id,name,union_name,upazila,is_active,patient_count"),
        supabase.from("v_risk_summary").select("chw_id,chw_name,low_count,moderate_count,high_count"),
        supabase.from("patients").select("id,chw_id,name,age,gestational_age_weeks,last_risk_level"),
        adminApi<{ chws: PendingChwRow[]; loadError?: boolean }>("/api/v1/admin/chws/pending-verifications").catch((err) => {
          setPendingChwError(err instanceof Error ? err.message : "Failed to load pending verifications");
          return { chws: [], loadError: true };
        })
      ]);

      if (chwRes.data && chwRes.data.length > 0) {
        setChws(chwRes.data as ChwListRow[]);
        setIsOffline(false);
      } else {
        setIsOffline(true);
        setChws(SEEDED_CHWS);
      }

      if (riskRes.data && riskRes.data.length > 0) {
        setRiskSummary(riskRes.data as RiskSummaryRow[]);
      } else {
        setRiskSummary(SEEDED_RISK_SUMMARY);
      }

      if (patientRes.data && patientRes.data.length > 0) {
        setPatients(patientRes.data as PatientRow[]);
      } else {
        setPatients(SEEDED_PATIENTS);
      }

      setPendingChws(pendingChwsRes.chws);
      if (!pendingChwsRes.loadError) {
        setPendingChwError(null);
      }
    } catch (err) {
      // Fallback to offline seeded data
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPendingChws = async () => {
    try {
      const payload = await adminApi<{ chws: PendingChwRow[] }>("/api/v1/admin/chws/pending-verifications");
      setPendingChws(payload.chws);
      setPendingChwError(null);
    } catch (err) {
      console.error("Error refreshing pending CHWs:", err);
      setPendingChwError(err instanceof Error ? err.message : "Failed to refresh pending verifications");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Real-time Postgres insert subscription
  useEffect(() => {
    const channel = supabase
      .channel("public-chws-inserts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chws"
        },
        (payload) => {
          const newChw = payload.new;
          if (newChw && newChw.verification_status === "PENDING") {
            Alert.alert(
              lang === "bn" ? "নতুন আবেদন!" : "New CHW Registration!",
              lang === "bn" 
                ? `নতুন স্বাস্থ্যকর্মী "${newChw.name}" নিবন্ধনের আবেদন করেছেন।`
                : `A new health worker "${newChw.name}" has registered and is pending verification.`,
              [
                { text: lang === "bn" ? "যাচাই করুন" : "Verify", onPress: () => setActiveTab("verifications") },
                { text: lang === "bn" ? "ঠিক আছে" : "OK" }
              ]
            );
            refreshPendingChws();
            loadDashboard();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lang, loadDashboard]);

  const handleApproveChw = async (chwId: string) => {
    try {
      await adminApi(`/api/v1/admin/chws/${encodeURIComponent(chwId)}/verification`, {
        method: "PATCH",
        body: JSON.stringify({ verification_status: "APPROVED" })
      });
      
      Alert.alert(
        lang === "bn" ? "অনুমোদিত" : "Approved",
        lang === "bn" ? "কর্মী সফলভাবে অনুমোদিত হয়েছে।" : "CHW worker successfully approved."
      );
      refreshPendingChws();
      loadDashboard();
    } catch (err: any) {
      Alert.alert(lang === "bn" ? "ব্যর্থ" : "Failed", err.message || "Failed to approve");
    }
  };

  const handleRejectChw = async () => {
    if (!rejectionReasonInput.trim()) {
      Alert.alert(lang === "bn" ? "ত্রুটি" : "Error", lang === "bn" ? "প্রত্যাখ্যানের কারণ লিখুন" : "Please input a rejection reason");
      return;
    }
    try {
      if (!rejectingChwId) throw new Error("No CHW selected for rejection");
      await adminApi(`/api/v1/admin/chws/${encodeURIComponent(rejectingChwId)}/verification`, {
        method: "PATCH",
        body: JSON.stringify({
          verification_status: "REJECTED",
          rejection_reason: rejectionReasonInput.trim()
        })
      });

      Alert.alert(
        lang === "bn" ? "প্রত্যাখ্যাত" : "Rejected",
        lang === "bn" ? "আবেদনটি প্রত্যাখ্যান করা হয়েছে।" : "Application has been rejected."
      );
      setRejectionModalVisible(false);
      setRejectingChwId(null);
      setRejectionReasonInput("");
      refreshPendingChws();
      loadDashboard();
    } catch (err: any) {
      Alert.alert(lang === "bn" ? "ব্যর্থ" : "Failed", err.message || "Failed to reject");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut().catch(() => undefined);
    await Promise.all([clearSession(), clearRoleSession()]);
    router.replace("/(auth)/login");
  };

  // Calculations
  const totalPatients = chws.reduce((sum, chw) => sum + chw.patient_count, 0);
  const activeChwsCount = chws.filter((chw) => chw.is_active).length;
  
  const lowRiskTotal = riskSummary.reduce((sum, row) => sum + row.low_count, 0);
  const moderateRiskTotal = riskSummary.reduce((sum, row) => sum + row.moderate_count, 0);
  const highRiskTotal = riskSummary.reduce((sum, row) => sum + row.high_count, 0);
  const totalRiskCount = lowRiskTotal + moderateRiskTotal + highRiskTotal || 1;

  // Search and filter algorithms
  const filteredChws = useMemo(() => {
    return chws.filter((chw) => {
      const match = chw.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    chw.union_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    chw.upazila.toLowerCase().includes(searchQuery.toLowerCase());
      return match;
    });
  }, [chws, searchQuery]);

  const filteredPatients = useMemo(() => {
    return patients.filter((pat) => {
      const matchQuery = pat.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRisk = selectedRiskFilter === "ALL" || pat.last_risk_level === selectedRiskFilter;
      const matchChw = selectedChwFilter === null || pat.chw_id === selectedChwFilter;
      return matchQuery && matchRisk && matchChw;
    });
  }, [patients, searchQuery, selectedRiskFilter, selectedChwFilter]);

  // Helper to map CHW name locally
  const getChwName = (chwId: string) => {
    const chw = chws.find((c) => c.chw_id === chwId);
    return chw ? chw.name.split(" ")[0] : "CHW";
  };

  // Helper for risk colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case "HIGH":
        return "#D32F2F";
      case "MODERATE":
        return "#EF6C00";
      default:
        return "#2E7D32";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F6" />
      {/* Dynamic Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Text style={styles.headerTitle}>{t.title}</Text>
            <View style={[styles.statusBadgeMicro, isOffline ? styles.statusBadgeOffline : styles.statusBadgeOnline]}>
              <View style={[styles.statusDot, { backgroundColor: isOffline ? "#EF6C00" : "#2E7D32" }]} />
              <Text style={[styles.statusBadgeTextMicro, { color: isOffline ? "#EF6C00" : "#2E7D32" }]}>
                {isOffline ? (lang === "bn" ? "অফলাইন" : "Offline") : (lang === "bn" ? "লাইভ" : "Live")}
              </Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
        </View>
        
        {/* Language Toggler */}
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => setLanguage(lang === "bn" ? "en" : "bn")}
            style={styles.langToggle}
          >
            <Icon name="language" size={16} color="#E57A58" />
            <Text style={styles.langToggleText}>
              {lang === "bn" ? "EN" : "বাং"}
            </Text>
          </Pressable>

          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Icon name="logout" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E57A58" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Summary Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.iconWrap, { backgroundColor: "#EEF8F1" }]}>
                <Icon name="people" size={24} color="#2E7D32" />
              </View>
              <Text style={styles.statLabel}>{t.activeChws}</Text>
              <Text style={styles.statValue}>{activeChwsCount}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconWrap, { backgroundColor: "#EBF2FC" }]}>
                <Icon name="assignment" size={24} color="#1565C0" />
              </View>
              <Text style={styles.statLabel}>{t.trackedPatients}</Text>
              <Text style={styles.statValue}>{totalPatients || patients.length}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconWrap, { backgroundColor: "#FFEBEE" }]}>
                <Icon name="healing" size={24} color="#C62828" />
              </View>
              <Text style={[styles.statLabel, { color: "#C62828" }]}>{t.highRiskPatients}</Text>
              <Text style={[styles.statValue, { color: "#C62828" }]}>{highRiskTotal}</Text>
            </View>
          </View>

          {/* Risk Level Horizontal Progress Bar */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t.riskLevel}</Text>
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBarPart,
                  { backgroundColor: "#D32F2F", flex: highRiskTotal / totalRiskCount }
                ]}
              />
              <View
                style={[
                  styles.progressBarPart,
                  { backgroundColor: "#EF6C00", flex: moderateRiskTotal / totalRiskCount }
                ]}
              />
              <View
                style={[
                  styles.progressBarPart,
                  { backgroundColor: "#2E7D32", flex: lowRiskTotal / totalRiskCount }
                ]}
              />
            </View>

            {/* Risk Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: "#D32F2F" }]} />
                <Text style={styles.legendText}>
                  {t.high}: {highRiskTotal}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: "#EF6C00" }]} />
                <Text style={styles.legendText}>
                  {t.moderate}: {moderateRiskTotal}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: "#2E7D32" }]} />
                <Text style={styles.legendText}>
                  {t.low}: {lowRiskTotal}
                </Text>
              </View>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchBarContainer}>
            <Icon name="search" size={18} color="#70605A" />
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchPlaceholder}
              placeholderTextColor="#A0908A"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
                <Icon name="close" size={18} color="#70605A" />
              </Pressable>
            )}
          </View>

          {/* Quick Filters Indicator */}
          {selectedChwFilter && (
            <View style={styles.filterAlertContainer}>
              <Text style={styles.filterAlertText}>
                {lang === "bn" 
                  ? `স্বাস্থ্যকর্মী "${getChwName(selectedChwFilter)}" এর রোগী ফিল্টার`
                  : `Filtered by CHW "${getChwName(selectedChwFilter)}"`}
              </Text>
              <Pressable
                onPress={() => setSelectedChwFilter(null)}
                style={styles.clearFilterBadge}
              >
                <Text style={styles.clearFilterBadgeText}>{t.clearFilter}</Text>
              </Pressable>
            </View>
          )}

          {/* Directory Tabs */}
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setActiveTab("chws")}
              style={[styles.tabButton, activeTab === "chws" && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === "chws" && styles.tabButtonTextActive]}>
                {t.chwTab}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("patients")}
              style={[styles.tabButton, activeTab === "patients" && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === "patients" && styles.tabButtonTextActive]}>
                {t.patientTab}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("verifications")}
              style={[styles.tabButton, activeTab === "verifications" && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === "verifications" && styles.tabButtonTextActive]}>
                {lang === "bn" ? "যাচাইকরণ অনুরোধ" : "Verification Requests"}
              </Text>
            </Pressable>
          </View>

          {/* Risk Level Filter Scroll (When Patient registry is active) */}
          {activeTab === "patients" && (
            <View style={styles.riskFiltersWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.riskFiltersScroll}
              >
                <Pressable
                  onPress={() => setSelectedRiskFilter("ALL")}
                  style={[
                    styles.filterPill,
                    selectedRiskFilter === "ALL" && styles.filterPillActiveALL
                  ]}
                >
                  <View style={[styles.pillDot, { backgroundColor: "#70605A" }]} />
                  <Text style={[styles.filterPillText, selectedRiskFilter === "ALL" && styles.filterPillTextActive]}>
                    {t.filterAll}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedRiskFilter("HIGH")}
                  style={[
                    styles.filterPill,
                    selectedRiskFilter === "HIGH" && styles.filterPillActiveHIGH
                  ]}
                >
                  <View style={[styles.pillDot, { backgroundColor: "#D32F2F" }]} />
                  <Text style={[
                    styles.filterPillText, 
                    selectedRiskFilter === "HIGH" && [styles.filterPillTextActive, { color: "#D32F2F" }]
                  ]}>
                    {t.filterHigh}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedRiskFilter("MODERATE")}
                  style={[
                    styles.filterPill,
                    selectedRiskFilter === "MODERATE" && styles.filterPillActiveMODERATE
                  ]}
                >
                  <View style={[styles.pillDot, { backgroundColor: "#EF6C00" }]} />
                  <Text style={[
                    styles.filterPillText, 
                    selectedRiskFilter === "MODERATE" && [styles.filterPillTextActive, { color: "#EF6C00" }]
                  ]}>
                    {t.filterMod}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedRiskFilter("LOW")}
                  style={[
                    styles.filterPill,
                    selectedRiskFilter === "LOW" && styles.filterPillActiveLOW
                  ]}
                >
                  <View style={[styles.pillDot, { backgroundColor: "#2E7D32" }]} />
                  <Text style={[
                    styles.filterPillText, 
                    selectedRiskFilter === "LOW" && [styles.filterPillTextActive, { color: "#2E7D32" }]
                  ]}>
                    {t.filterLow}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          )}

          {/* Directory Tables */}
          {activeTab === "chws" && (
            <View style={styles.sectionCard}>
              <View style={styles.tableTitleContainer}>
                <Text style={styles.sectionTitle}>{t.chwList}</Text>
                <Text style={styles.tipText}>{t.clickRowToView}</Text>
              </View>
              
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 2.2 }]}>{t.name}</Text>
                <Text style={[styles.headerCell, { flex: 2.0, textAlign: "center" }]}>{t.union}</Text>
                <Text style={[styles.headerCell, { flex: 2.2, textAlign: "center" }]}>{t.upazila}</Text>
                <Text style={[styles.headerCell, { flex: 1.3, textAlign: "right" }]}>{t.patients}</Text>
              </View>

              {/* Table Rows */}
              {filteredChws.map((chw, idx) => (
                <Pressable
                  key={chw.chw_id}
                  onPress={() => setSelectedChw(chw)}
                  style={({ pressed }) => [
                    styles.tableRow,
                    idx % 2 === 0 ? styles.rowEven : styles.rowOdd,
                    pressed && styles.rowPressed
                  ]}
                >
                  <Text style={[styles.cellText, styles.cellName, { flex: 2.2 }]}>{chw.name}</Text>
                  <Text style={[styles.cellText, { flex: 2.0, textAlign: "center" }]}>{chw.union_name}</Text>
                  <Text style={[styles.cellText, { flex: 2.2, textAlign: "center" }]}>{chw.upazila}</Text>
                  <Text style={[styles.cellText, styles.cellPatients, { flex: 1.3, textAlign: "right" }]}>
                    {chw.patient_count}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {activeTab === "patients" && (
            <View style={styles.sectionCard}>
              <View style={styles.tableTitleContainer}>
                <Text style={styles.sectionTitle}>{t.patientList}</Text>
                <Text style={styles.tipText}>{t.clickRowToView}</Text>
              </View>
              
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 3.2 }]}>{t.name}</Text>
                <Text style={[styles.headerCell, { flex: 0.8, textAlign: "center" }]}>{t.age}</Text>
                <Text style={[styles.headerCell, { flex: 0.9, textAlign: "center" }]}>{t.weeks}</Text>
                <Text style={[styles.headerCell, { flex: 1.3, textAlign: "center" }]}>{t.assignedChw}</Text>
                <Text style={[styles.headerCell, { flex: 1.0, textAlign: "right" }]}>{t.risk}</Text>
              </View>

              {/* Table Rows */}
              {filteredPatients.map((pat, idx) => (
                <Pressable
                  key={pat.id}
                  onPress={() => setSelectedPatient(pat)}
                  style={({ pressed }) => [
                    styles.tableRow,
                    idx % 2 === 0 ? styles.rowEven : styles.rowOdd,
                    pressed && styles.rowPressed
                  ]}
                >
                  <Text style={[styles.cellText, styles.cellName, { flex: 3.2 }]}>{pat.name}</Text>
                  <Text style={[styles.cellText, { flex: 0.8, textAlign: "center" }]}>{pat.age}</Text>
                  <Text style={[styles.cellText, { flex: 0.9, textAlign: "center" }]}>{pat.gestational_age_weeks}</Text>
                  <Text style={[styles.cellText, { flex: 1.3, textAlign: "center" }]}>{getChwName(pat.chw_id)}</Text>
                  <Text
                    style={[
                      styles.cellText,
                      {
                        flex: 1.0,
                        textAlign: "right",
                        fontWeight: "bold",
                        color: getRiskColor(pat.last_risk_level)
                      }
                    ]}
                  >
                    {lang === "bn" 
                      ? pat.last_risk_level === "HIGH" ? "উচ্চ" : pat.last_risk_level === "MODERATE" ? "মাঝারি" : "কম"
                      : pat.last_risk_level}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Verification Requests Tab View */}
          {activeTab === "verifications" && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {lang === "bn" ? "অপেক্ষমাণ স্বাস্থ্যকর্মী যাচাইকরণ" : "Pending Health Worker Verifications"}
              </Text>
              {pendingChwError ? (
                <Text style={styles.pendingErrorText}>{pendingChwError}</Text>
              ) : null}
              {pendingChws.length === 0 ? (
                <View style={styles.emptyPendingContainer}>
                  <Icon name="check-circle" size={40} color="#2E7D32" />
                  <Text style={styles.emptyPendingText}>
                    {lang === "bn" ? "কোন অপেক্ষমাণ আবেদন নেই" : "No pending verification requests"}
                  </Text>
                </View>
              ) : (
                pendingChws.map((chw) => (
                  <View key={chw.id} style={styles.pendingChwCard}>
                    <View style={styles.pendingChwHeader}>
                      <Text style={styles.pendingChwName}>{chw.name}</Text>
                      <View style={styles.pendingChwStatusBadge}>
                        <Text style={styles.pendingChwStatusBadgeText}>{chw.verification_status}</Text>
                      </View>
                    </View>

                    <View style={styles.pendingChwDetails}>
                      <View style={styles.pendingDetailRow}>
                        <Text style={styles.pendingDetailLabel}>{lang === "bn" ? "ইউনিয়ন/এলাকা" : "Union/Area"}:</Text>
                        <Text style={styles.pendingDetailValue}>{chw.union_name}</Text>
                      </View>
                      <View style={styles.pendingDetailRow}>
                        <Text style={styles.pendingDetailLabel}>{lang === "bn" ? "উপজেলা" : "Upazila"}:</Text>
                        <Text style={styles.pendingDetailValue}>{chw.upazila}</Text>
                      </View>
                      <View style={styles.pendingDetailRow}>
                        <Text style={styles.pendingDetailLabel}>{lang === "bn" ? "প্রতিষ্ঠান" : "Organization"}:</Text>
                        <Text style={styles.pendingDetailValue}>{chw.organization_name || "—"}</Text>
                      </View>
                      <View style={styles.pendingDetailRow}>
                        <Text style={styles.pendingDetailLabel}>{lang === "bn" ? "কর্মী ধরন" : "Worker Type"}:</Text>
                        <Text style={styles.pendingDetailValue}>{chw.worker_type || "—"}</Text>
                      </View>
                      <View style={styles.pendingDetailRow}>
                        <Text style={styles.pendingDetailLabel}>{lang === "bn" ? "অভিজ্ঞতা" : "Experience"}:</Text>
                        <Text style={styles.pendingDetailValue}>{chw.years_of_experience} {lang === "bn" ? "বছর" : "years"}</Text>
                      </View>
                    </View>

                    {chw.certificate_url && (
                      <Pressable
                        onPress={() => Linking.openURL(String(chw.certificate_url))}
                        style={styles.pendingViewDocBtn}
                      >
                        <Icon name="insert-drive-file" color="#E57A58" size={16} />
                        <Text style={styles.pendingViewDocBtnText}>
                          {lang === "bn" ? "সার্টিফিকেট নথি দেখুন" : "View Certificate Document"}
                        </Text>
                      </Pressable>
                    )}

                    <View style={styles.pendingActionButtons}>
                      <Pressable
                        onPress={() => {
                          setRejectingChwId(chw.id);
                          setRejectionModalVisible(true);
                        }}
                        style={[styles.pendingActionBtn, styles.pendingRejectBtn]}
                      >
                        <Text style={styles.pendingRejectBtnText}>
                          {lang === "bn" ? "প্রত্যাখ্যান" : "Reject"}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleApproveChw(chw.id)}
                        style={[styles.pendingActionBtn, styles.pendingApproveBtn]}
                      >
                        <Text style={styles.pendingApproveBtnText}>
                          {lang === "bn" ? "অনুমোদন" : "Approve"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

        </ScrollView>
      )}

      {/* Patient Profile Detail Modal */}
      {selectedPatient && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedPatient}
          onRequestClose={() => setSelectedPatient(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t.patientDetailTitle}</Text>
                <Pressable onPress={() => setSelectedPatient(null)} style={styles.modalCloseBtn}>
                  <Icon name="close" size={20} color="#70605A" />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.patientName}</Text>
                  <Text style={styles.detailValue}>{selectedPatient.name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.ageText}</Text>
                  <Text style={styles.detailValue}>{selectedPatient.age} {t.years}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.gestationText}</Text>
                  <Text style={styles.detailValue}>{selectedPatient.gestational_age_weeks} {lang === "bn" ? "সপ্তাহ" : "weeks"}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.chwName}</Text>
                  <Text style={styles.detailValue}>{getChwName(selectedPatient.chw_id)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.risk}</Text>
                  <View style={[styles.modalRiskBadge, { backgroundColor: getRiskColor(selectedPatient.last_risk_level) + "15", borderColor: getRiskColor(selectedPatient.last_risk_level) }]}>
                    <Text style={[styles.modalRiskText, { color: getRiskColor(selectedPatient.last_risk_level) }]}>
                      {lang === "bn" 
                        ? selectedPatient.last_risk_level === "HIGH" ? "উচ্চ ঝুঁকি" : selectedPatient.last_risk_level === "MODERATE" ? "মাঝারি ঝুঁকি" : "কম ঝুঁকি"
                        : selectedPatient.last_risk_level}
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable onPress={() => setSelectedPatient(null)} style={styles.closeActionBtn}>
                <Text style={styles.closeActionBtnText}>{t.closeBtn}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* CHW Profile Detail Modal */}
      {selectedChw && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedChw}
          onRequestClose={() => setSelectedChw(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t.chwDetailTitle}</Text>
                <Pressable onPress={() => setSelectedChw(null)} style={styles.modalCloseBtn}>
                  <Icon name="close" size={20} color="#70605A" />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.name}:</Text>
                  <Text style={styles.detailValue}>{selectedChw.name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.unionLabel}</Text>
                  <Text style={styles.detailValue}>{selectedChw.union_name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.upazilaLabel}</Text>
                  <Text style={styles.detailValue}>{selectedChw.upazila}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.activeLabel}:</Text>
                  <Text style={[styles.detailValue, { color: selectedChw.is_active ? "#2E7D32" : "#D32F2F", fontWeight: "bold" }]}>
                    {selectedChw.is_active ? t.activeText : t.inactiveText}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{t.patientCountText}</Text>
                  <Text style={styles.detailValue}>{selectedChw.patient_count}</Text>
                </View>
              </View>

              <View style={styles.modalActionsRow}>
                <Pressable
                  onPress={() => {
                    setSelectedChwFilter(selectedChw.chw_id);
                    setActiveTab("patients");
                    setSelectedChw(null);
                  }}
                  style={styles.filterActionBtn}
                >
                  <Icon name="filter-list" size={16} color="#FFFFFF" />
                  <Text style={styles.filterActionBtnText}>{t.chwPatientsFilterBtn}</Text>
                </Pressable>

                <Pressable onPress={() => setSelectedChw(null)} style={styles.closeActionBtnSecondary}>
                  <Text style={styles.closeActionBtnSecondaryText}>{t.closeBtn}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModalVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={rejectionModalVisible}
          onRequestClose={() => {
            setRejectionModalVisible(false);
            setRejectingChwId(null);
            setRejectionReasonInput("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {lang === "bn" ? "প্রত্যাখ্যানের কারণ লিখুন" : "Input Rejection Reason"}
                </Text>
                <Pressable
                  onPress={() => {
                    setRejectionModalVisible(false);
                    setRejectingChwId(null);
                    setRejectionReasonInput("");
                  }}
                  style={styles.modalCloseBtn}
                >
                  <Icon name="close" size={20} color="#70605A" />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <TextInput
                  style={styles.rejectionTextInput}
                  placeholder={lang === "bn" ? "কারণ লিখুন (যেমন: সার্টিফিকেট অস্পষ্ট বা ত্রুটিযুক্ত)" : "Enter reason (e.g. invalid certificate)"}
                  placeholderTextColor="#A0908A"
                  multiline
                  numberOfLines={4}
                  value={rejectionReasonInput}
                  onChangeText={setRejectionReasonInput}
                />
              </View>

              <View style={styles.modalActionsRow}>
                <Pressable
                  onPress={() => {
                    setRejectionModalVisible(false);
                    setRejectingChwId(null);
                    setRejectionReasonInput("");
                  }}
                  style={styles.closeActionBtnSecondary}
                >
                  <Text style={styles.closeActionBtnSecondaryText}>
                    {lang === "bn" ? "বাতিল" : "Cancel"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleRejectChw}
                  style={styles.filterActionBtn}
                >
                  <Text style={styles.filterActionBtnText}>
                    {lang === "bn" ? "প্রত্যাখ্যান নিশ্চিত করুন" : "Confirm Rejection"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F6",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 36) : 0
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE9"
  },
  headerLeft: {
    flex: 1
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E57A58"
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#70605A",
    marginTop: 2
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCEFEA",
    borderWidth: 1,
    borderColor: "#F7DDD3",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4
  },
  langToggleText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#E57A58"
  },
  logoutBtn: {
    backgroundColor: "#E57A58",
    padding: 7,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  statusBadgeMicro: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusBadgeTextMicro: {
    fontSize: 10,
    fontWeight: "bold"
  },
  statusBadgeOnline: {
    backgroundColor: "#E8F5E9"
  },
  statusBadgeOffline: {
    backgroundColor: "#FFF3E0"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12
  },
  loadingText: {
    color: "#70605A",
    fontSize: 14
  },
  scrollContent: {
    padding: 16,
    gap: 12
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F5ECE9",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  iconWrap: {
    padding: 8,
    borderRadius: 16,
    marginBottom: 6
  },
  statLabel: {
    fontSize: 10,
    color: "#70605A",
    textAlign: "center",
    fontWeight: "500"
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C2523",
    marginTop: 2
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F5ECE9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2C2523",
    marginBottom: 8
  },
  progressContainer: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F5ECE9",
    flexDirection: "row",
    overflow: "hidden"
  },
  progressBarPart: {
    height: "100%"
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendText: {
    fontSize: 11,
    color: "#70605A",
    fontWeight: "500"
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F5ECE9",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#2C2523",
    fontWeight: "500"
  },
  clearSearchBtn: {
    padding: 4
  },
  filterAlertContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FCEFEA",
    borderWidth: 1,
    borderColor: "#F7DDD3",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  filterAlertText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E57A58"
  },
  clearFilterBadge: {
    backgroundColor: "#E57A58",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  clearFilterBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F5ECE9",
    borderRadius: 20,
    padding: 4,
    gap: 4
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 16
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#70605A"
  },
  tabButtonTextActive: {
    color: "#E57A58",
    fontWeight: "700"
  },
  riskFiltersWrap: {
    marginTop: -4,
    marginBottom: -4
  },
  riskFiltersScroll: {
    gap: 8,
    paddingVertical: 4
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F5ECE9"
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  filterPillActiveALL: {
    backgroundColor: "#FCEFEA",
    borderColor: "#E57A58",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1
  },
  filterPillActiveHIGH: {
    backgroundColor: "#FFEBEE",
    borderColor: "#D32F2F",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1
  },
  filterPillActiveMODERATE: {
    backgroundColor: "#FFF3E0",
    borderColor: "#EF6C00",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1
  },
  filterPillActiveLOW: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1
  },
  filterPillText: {
    fontSize: 12,
    color: "#70605A",
    fontWeight: "600"
  },
  filterPillTextActive: {
    color: "#E57A58",
    fontWeight: "700"
  },
  tableTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  tipText: {
    fontSize: 10,
    color: "#A0908A",
    fontWeight: "500"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9F5F3",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4
  },
  headerCell: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#70605A"
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center"
  },
  rowEven: {
    backgroundColor: "#FFFFFF"
  },
  rowOdd: {
    backgroundColor: "#FCFAF9"
  },
  rowPressed: {
    backgroundColor: "#F0E6E2"
  },
  cellText: {
    fontSize: 12,
    color: "#544642"
  },
  cellName: {
    fontWeight: "600",
    color: "#2C2523"
  },
  cellPatients: {
    fontWeight: "700",
    color: "#E57A58"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContent: {
    width: width - 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE9",
    paddingBottom: 12,
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C2523"
  },
  modalCloseBtn: {
    padding: 4
  },
  modalBody: {
    gap: 14,
    marginBottom: 20
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  detailLabel: {
    fontSize: 13,
    color: "#70605A",
    fontWeight: "600"
  },
  detailValue: {
    fontSize: 14,
    color: "#2C2523",
    fontWeight: "700"
  },
  modalRiskBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  modalRiskText: {
    fontSize: 12,
    fontWeight: "bold"
  },
  closeActionBtn: {
    backgroundColor: "#E57A58",
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  closeActionBtnText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 10
  },
  filterActionBtn: {
    flex: 2,
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#E57A58",
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  filterActionBtnText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  closeActionBtnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E57A58",
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  closeActionBtnSecondaryText: {
    fontSize: 14,
    color: "#E57A58",
    fontWeight: "bold"
  },
  emptyPendingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 10
  },
  emptyPendingText: {
    color: "#70605A",
    fontSize: 14,
    fontWeight: "600"
  },
  pendingErrorText: {
    color: "#B42318",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12
  },
  pendingChwCard: {
    backgroundColor: "#FCFAF9",
    borderColor: "#F5ECE9",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 10
  },
  pendingChwHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  pendingChwName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2C2523"
  },
  pendingChwStatusBadge: {
    backgroundColor: "#FCEBE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  pendingChwStatusBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#E57A58"
  },
  pendingChwDetails: {
    gap: 4
  },
  pendingDetailRow: {
    flexDirection: "row",
    gap: 6
  },
  pendingDetailLabel: {
    fontSize: 12,
    color: "#70605A",
    fontWeight: "600",
    width: 90
  },
  pendingDetailValue: {
    fontSize: 12,
    color: "#2C2523",
    fontWeight: "700",
    flex: 1
  },
  pendingViewDocBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FCEBE5",
    borderRadius: 8,
    alignSelf: "flex-start"
  },
  pendingViewDocBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#E57A58"
  },
  pendingActionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6
  },
  pendingActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  pendingRejectBtn: {
    borderWidth: 1.5,
    borderColor: "#ba1a1a",
    backgroundColor: "transparent"
  },
  pendingRejectBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ba1a1a"
  },
  pendingApproveBtn: {
    backgroundColor: "#2E7D32"
  },
  pendingApproveBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  rejectionTextInput: {
    backgroundColor: "#FFF9F6",
    borderColor: "#EBDCD9",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#2C2523",
    textAlignVertical: "top",
    minHeight: 80
  }
});

