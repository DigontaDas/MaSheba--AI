import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { getCurrentMotherProfile } from "@/auth/roleSession";
import { supabase } from "@/auth/supabaseAuth";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import { callPhoneNumber } from "@/utils/phone";

function parsePointWkt(wkt: string | null): { latitude: number; longitude: number } | null {
  if (!wkt) return null;
  const match = wkt.match(/POINT\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)/i);
  if (match) {
    const longitude = parseFloat(match[1]);
    const latitude = parseFloat(match[2]);
    return { latitude, longitude };
  }
  return null;
}

function parseEwkbPoint(ewkbHex: string | null): { latitude: number; longitude: number } | null {
  if (!ewkbHex || ewkbHex.length < 50) return null;
  const isLittleEndian = ewkbHex.startsWith("01");
  try {
    const longHex = ewkbHex.substring(18, 34);
    const latHex = ewkbHex.substring(34, 50);
    
    const hexToDouble = (hex: string) => {
      const bytes = new Uint8Array(8);
      for (let i = 0; i < 8; i++) {
        const byteIndex = isLittleEndian ? i : 7 - i;
        bytes[byteIndex] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
      }
      return new DataView(bytes.buffer).getFloat64(0, true);
    };

    return {
      longitude: hexToDouble(longHex),
      latitude: hexToDouble(latHex)
    };
  } catch (e) {
    return null;
  }
}

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "https://maasheba-backend.onrender.com";

type HealthCenterTab = "chw" | "review" | "hospitals";

interface CHW {
  chw_id: string;
  name: string;
  union_name: string;
  upazila: string;
  distance_km: number;
  latitude: number;
  longitude: number;
}

interface ConnectionRequest {
  id: string;
  status: "pending" | "assigned" | "active" | "completed" | "cancelled";
  chw_id: string | null;
  chws?: {
    name: string;
    phone?: string;
  };
}

interface ChwReview {
  id: string;
  rating: number;
  review_text: string | null;
}

interface ReassignmentRequest {
  id: string;
  status: "pending" | "assigned" | "dismissed" | "cancelled";
}

interface Hospital {
  id: string;
  name: string;
  type: "government" | "private" | "clinic" | string;
  district?: string | null;
  upazila?: string | null;
  phone?: string | null;
  distance_km: number;
  is_partner?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
}

const DEMO_MOTHER_IDS = new Set(["60000000-0000-0000-0000-000000000002", "mother-demo-id"]);
const DEMO_CHW: CHW = {
  chw_id: "00000000-0000-0000-0000-0000000000a1",
  name: "Mst. Jahanara Begum",
  union_name: "Bhallabpur",
  upazila: "Narsingdi Sadar",
  distance_km: 1.25,
  latitude: 23.8183,
  longitude: 90.4075
};

const DEMO_HOSPITALS: Hospital[] = [
  {
    id: "demo-hospital-1",
    name: "Narsingdi District Hospital",
    type: "government",
    district: "Narsingdi",
    upazila: "Sadar",
    phone: "16263",
    distance_km: 3.4,
    is_partner: true,
    latitude: 23.9205,
    longitude: 90.7176
  },
  {
    id: "demo-hospital-2",
    name: "Mother Care Clinic",
    type: "clinic",
    district: "Narsingdi",
    upazila: "Sadar",
    phone: "16767",
    distance_km: 5.8,
    is_partner: false,
    latitude: 23.918,
    longitude: 90.714
  }
];

const reassignmentOptions = [
  { key: "not_responding" as const, labelBn: "স্বাস্থ্যকর্মী যোগাযোগ করছেন না", labelEn: "Not responding" },
  { key: "moved_area" as const, labelBn: "ভিন্ন এলাকায় চলে গেছি", labelEn: "Moved area" },
  { key: "other" as const, labelBn: "অন্য কারণ", labelEn: "Other reason" }
];

function isDemoMother(motherId: string | null | undefined) {
  return Boolean(motherId && DEMO_MOTHER_IDS.has(motherId));
}

function initialsForName(name?: string) {
  if (!name) return "M";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatChwName(name: string | null | undefined, lang: string) {
  if (!name) return lang === "bn" ? "স্বাস্থ্যকর্মী" : "Health Worker";
  if (name === "CHW_A") {
    return lang === "bn" ? "রাহেলা বেগম" : "Rahela Begum";
  }
  if (name === "CHW_B") {
    return lang === "bn" ? "মোসাঃ সুফিয়া খাতুন" : "Mst. Sufia Khatun";
  }
  if (name.startsWith("CHW_")) {
    const num = name.replace("CHW_", "");
    return lang === "bn" ? `স্বাস্থ্যকর্মী ${num}` : `Health Worker ${num}`;
  }
  return name;
}

export default function FindChwScreen() {
  const { language: lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<HealthCenterTab>("chw");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [motherId, setMotherId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyChws, setNearbyChws] = useState<CHW[]>([]);
  const [pendingRequest, setPendingRequest] = useState<ConnectionRequest | null>(null);
  const [myReview, setMyReview] = useState<ChwReview | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [pendingReassignment, setPendingReassignment] = useState<ReassignmentRequest | null>(null);
  const [reassignmentReason, setReassignmentReason] = useState<"not_responding" | "moved_area" | "other">("not_responding");
  const [reassignmentNote, setReassignmentNote] = useState("");
  const [reassignmentSubmitting, setReassignmentSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalsError, setHospitalsError] = useState<string | null>(null);

  const assignedChwName = pendingRequest?.chws?.name
    ? formatChwName(pendingRequest.chws.name, lang)
    : (lang === "bn" ? "নিযুক্ত স্বাস্থ্যকর্মী" : "Assigned CHW");
  const assignedChwArea = nearbyChws.find((chw) => chw.chw_id === pendingRequest?.chw_id);

  const setDemoChwState = (mId: string) => {
    setCoords({ latitude: 23.8103, longitude: 90.4125 });
    setNearbyChws([DEMO_CHW]);
    setHospitals(DEMO_HOSPITALS);
    setHospitalsError(null);
    setPendingRequest({
      id: "demo-req-1",
      status: "assigned",
      chw_id: DEMO_CHW.chw_id,
      chws: { name: DEMO_CHW.name, phone: "16767" }
    });
    setMyReview({ id: "demo-review-1", rating: 5, review_text: "" });
    setReviewRating(5);
    setReviewText("");
    setPendingReassignment(null);
    setMotherId(mId);
  };

  const fetchHospitals = async (latitude: number, longitude: number) => {
    setHospitalsLoading(true);
    setHospitalsError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/hospitals/nearby?lat=${latitude}&lng=${longitude}&radius_km=15`);
      if (!response.ok) throw new Error("Hospital search failed");
      const data = await response.json();
      setHospitals(Array.isArray(data) ? data : []);
    } catch {
      setHospitals([]);
      setHospitalsError(lang === "bn" ? "হাসপাতালের তালিকা লোড করা যায়নি।" : "Could not load nearby hospitals.");
    } finally {
      setHospitalsLoading(false);
    }
  };

  const fetchReviewAndReassignment = async (mId: string, chwId: string | null) => {
    if (!chwId) {
      setMyReview(null);
      setPendingReassignment(null);
      return;
    }
    if (isDemoMother(mId)) {
      setMyReview({ id: "demo-review-1", rating: 5, review_text: "" });
      setReviewRating(5);
      setReviewText("");
      setPendingReassignment(null);
      return;
    }

    const [{ data: review }, { data: reassignment }] = await Promise.all([
      supabase
        .from("chw_reviews")
        .select("id,rating,review_text")
        .eq("mother_id", mId)
        .eq("chw_id", chwId)
        .maybeSingle(),
      supabase
        .from("chw_reassignment_requests")
        .select("id,status")
        .eq("mother_id", mId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    if (review) {
      setMyReview(review as ChwReview);
      setReviewRating(review.rating);
      setReviewText(review.review_text ?? "");
    } else {
      setMyReview(null);
      setReviewRating(5);
      setReviewText("");
    }
    setPendingReassignment(reassignment as ReassignmentRequest | null);
  };

  const fetchRequestStatus = async (mId: string, profile?: any) => {
    if (isDemoMother(mId)) {
      setPendingRequest({
        id: "demo-req-1",
        status: "assigned",
        chw_id: DEMO_CHW.chw_id,
        chws: { name: DEMO_CHW.name, phone: "16767" }
      });
      return;
    }

    try {
      const { data } = await supabase
        .from("connection_requests")
        .select("id,status,chw_id")
        .eq("mother_id", mId)
        .in("status", ["pending", "assigned"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) {
        let fallbackRequest: ConnectionRequest | null = null;
        if (profile?.patientId) {
          const { data: patientData } = await supabase
            .from("patients")
            .select("chw_id")
            .eq("id", profile.patientId)
            .maybeSingle();

          if (patientData?.chw_id) {
            const { data: chwDetails } = await supabase
              .from("chws")
              .select("name,phone")
              .eq("id", patientData.chw_id)
              .maybeSingle();

            fallbackRequest = {
              id: `profile-assigned-${patientData.chw_id}`,
              status: "assigned",
              chw_id: patientData.chw_id,
              chws: chwDetails ? { name: chwDetails.name, phone: chwDetails.phone ?? undefined } : undefined
            };
          }
        }

        if (fallbackRequest) {
          setPendingRequest(fallbackRequest);
          await fetchReviewAndReassignment(mId, fallbackRequest.chw_id);
          return;
        }

        setPendingRequest(null);
        setMyReview(null);
        setPendingReassignment(null);
        return;
      }

      const requestData: ConnectionRequest = {
        id: data.id,
        status: data.status as ConnectionRequest["status"],
        chw_id: data.chw_id
      };

      if (data.chw_id) {
        const { data: chw } = await supabase.from("chws").select("name,phone").eq("id", data.chw_id).maybeSingle();
        if (chw) requestData.chws = { name: chw.name, phone: chw.phone };
      }

      setPendingRequest(requestData);
      await fetchReviewAndReassignment(mId, requestData.status === "assigned" ? requestData.chw_id : null);
    } catch (err) {
      console.warn("Failed to fetch request status:", err);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getCurrentMotherProfile();
      if (!profile) {
        setLoading(false);
        return;
      }

      if (isDemoMother(profile.id)) {
        setIsOffline(false);
        setDemoChwState(profile.id);
        return;
      }

      setMotherId(profile.id);

      const net = await Network.getNetworkStateAsync().catch(() => ({ isConnected: true, isInternetReachable: true }));
      const offline = net.isConnected === false || net.isInternetReachable === false;
      setIsOffline(offline);

      await fetchRequestStatus(profile.id, profile);

      if (offline) {
        setNearbyChws([]);
        setHospitals([]);
        setHospitalsError(lang === "bn" ? "হাসপাতাল দেখতে ইন্টারনেট সংযোগ করুন।" : "Connect to the internet to view hospitals.");
        return;
      }

      let currentCoords = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const lastLoc = await Location.getLastKnownPositionAsync({});
          if (lastLoc) {
            currentCoords = { latitude: lastLoc.coords.latitude, longitude: lastLoc.coords.longitude };
            setCoords(currentCoords);
          }
        }
      } catch (lastLocErr) {
        console.warn("Failed to get last known location:", lastLocErr);
      }

      if (!currentCoords && profile.location) {
        const parsed = parsePointWkt(profile.location) || parseEwkbPoint(profile.location);
        if (parsed) {
          currentCoords = parsed;
          setCoords(parsed);
        }
      }

      if (currentCoords) {
        try {
          const [{ data, error }] = await Promise.all([
            supabase.rpc("find_nearby_chws", {
              mother_lat: currentCoords.latitude,
              mother_lng: currentCoords.longitude,
              radius_km: 10.0
            }),
            fetchHospitals(currentCoords.latitude, currentCoords.longitude)
          ]);
          if (!error && data) {
            setNearbyChws(data);
          }
        } catch (fastLoadErr) {
          console.warn("Fast load of health centers failed:", fastLoadErr);
        }
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const freshCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          
          const coordsDiff = !currentCoords || 
            Math.abs(currentCoords.latitude - freshCoords.latitude) > 0.001 || 
            Math.abs(currentCoords.longitude - freshCoords.longitude) > 0.001;

          if (coordsDiff) {
            setCoords(freshCoords);
            const [{ data, error }] = await Promise.all([
              supabase.rpc("find_nearby_chws", {
                mother_lat: freshCoords.latitude,
                mother_lng: freshCoords.longitude,
                radius_km: 10.0
              }),
              fetchHospitals(freshCoords.latitude, freshCoords.longitude)
            ]);
            if (error) throw error;
            setNearbyChws(data || []);
          }
        } else if (!currentCoords) {
          setHospitalsError(lang === "bn" ? "কাছের হাসপাতাল দেখাতে লোকেশন অনুমতি দরকার।" : "Location permission is needed to show nearby hospitals.");
        }
      } catch (locErr) {
        console.warn("Failed to get high-accuracy location:", locErr);
        if (!currentCoords) {
          setNearbyChws([]);
          setHospitals([]);
          setHospitalsError(lang === "bn" ? "কাছের হাসপাতাল ও স্বাস্থ্যকর্মী দেখতে জিপিএস সচল করুন।" : "Please enable GPS to view nearby hospitals and health workers.");
        }
      }
    } catch (err) {
      console.error("Failed to load health center data:", err);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useFocusEffect(
    useCallback(() => {
      loadData().catch(() => undefined);
    }, [loadData])
  );

  const handleRequestChw = async () => {
    if (!motherId) return;
    setSubmitting(true);
    try {
      const pointWkt = coords ? `POINT(${coords.longitude} ${coords.latitude})` : null;
      const { error } = await supabase.from("connection_requests").insert({
        mother_id: motherId,
        mother_location: pointWkt,
        status: "pending"
      });

      if (error) throw error;

      Alert.alert(
        lang === "bn" ? "অনুরোধ পাঠানো হয়েছে" : "Request Submitted",
        lang === "bn" ? "অ্যাডমিন শীঘ্রই একজন স্বাস্থ্যকর্মী নিয়োগ করবেন।" : "An administrator will assign a health worker shortly."
      );
      await fetchRequestStatus(motherId);
    } catch (err: any) {
      Alert.alert(lang === "bn" ? "ব্যর্থ হয়েছে" : "Submission Failed", err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestSpecificChw = async (chwId: string, chwName: string) => {
    if (!motherId) return;
    setSubmitting(true);
    try {
      const pointWkt = coords ? `POINT(${coords.longitude} ${coords.latitude})` : null;
      const { error } = await supabase.from("connection_requests").insert({
        mother_id: motherId,
        mother_location: pointWkt,
        status: "pending",
        chw_id: chwId
      });

      if (error) throw error;

      Alert.alert(
        lang === "bn" ? "অনুরোধ পাঠানো হয়েছে" : "Request Submitted",
        lang === "bn"
          ? `স্বাস্থ্যকর্মী ${formatChwName(chwName, lang)} এর জন্য অনুরোধ পাঠানো হয়েছে। অ্যাডমিন শীঘ্রই অনুমোদন করবেন।`
          : `Request for health worker ${formatChwName(chwName, lang)} has been sent. Admin will approve shortly.`
      );
      const profile = await getCurrentMotherProfile();
      await fetchRequestStatus(motherId, profile);
    } catch (err: any) {
      Alert.alert(lang === "bn" ? "ব্যর্থ হয়েছে" : "Submission Failed", err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChat = () => {
    router.push({ pathname: "/(mother-tabs)/chat", params: { mode: "chw" } });
  };

  const handleSubmitReview = async () => {
    if (!motherId || !pendingRequest?.chw_id) return;
    const cleanText = reviewText.trim();
    if (cleanText.length > 300) {
      Alert.alert(lang === "bn" ? "রিভিউ বড় হয়েছে" : "Review too long", lang === "bn" ? "রিভিউ ৩০০ অক্ষরের মধ্যে লিখুন।" : "Keep the review within 300 characters.");
      return;
    }

    setReviewSubmitting(true);
    try {
      const payload = {
        mother_id: motherId,
        chw_id: pendingRequest.chw_id,
        rating: reviewRating,
        review_text: cleanText || null,
        status: "active"
      };
      const query = supabase.from("chw_reviews");
      const existingReviewId = myReview?.id && !myReview.id.startsWith("demo-") ? myReview.id : null;
      const { data, error } = existingReviewId
        ? await query.update(payload).eq("id", existingReviewId).select("id,rating,review_text").single()
        : await query.upsert(payload, { onConflict: "mother_id,chw_id" }).select("id,rating,review_text").single();
      if (error) throw error;
      setMyReview(data as ChwReview);
      Alert.alert(lang === "bn" ? "রিভিউ সংরক্ষিত" : "Review saved", lang === "bn" ? "আপনার রিভিউ সংরক্ষণ করা হয়েছে।" : "Your review has been saved.");
    } catch (err: any) {
      if (isDemoMother(motherId)) {
        const demoReview = { id: myReview?.id ?? "demo-review-1", rating: reviewRating, review_text: cleanText || null };
        setMyReview(demoReview);
      }
      Alert.alert(lang === "bn" ? "রিভিউ পাঠানো যায়নি" : "Review failed", err.message || "Something went wrong");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitReassignment = async () => {
    if (!motherId || !pendingRequest?.chw_id || pendingReassignment) return;
    if (isDemoMother(motherId)) {
      setPendingReassignment({ id: "demo-reassignment-1", status: "pending" });
      Alert.alert("অনুরোধ পাঠানো হয়েছে", lang === "bn" ? "অ্যাডমিন আপনার অনুরোধ দেখবেন।" : "Admin will review your request.");
      return;
    }

    setReassignmentSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("chw_reassignment_requests")
        .insert({
          mother_id: motherId,
          current_chw_id: pendingRequest.chw_id,
          reason: reassignmentReason,
          note: reassignmentNote.trim() || null,
          status: "pending"
        })
        .select("id,status")
        .single();
      if (error) throw error;
      setPendingReassignment(data as ReassignmentRequest);
      setReassignmentNote("");
      Alert.alert("অনুরোধ পাঠানো হয়েছে", lang === "bn" ? "অ্যাডমিন আপনার অনুরোধ দেখবেন।" : "Admin will review your request.");
    } catch (err: any) {
      Alert.alert(lang === "bn" ? "অনুরোধ পাঠানো যায়নি" : "Request failed", err.message || "Something went wrong");
    } finally {
      setReassignmentSubmitting(false);
    }
  };

  const formatDistance = (dist: number) => {
    const kmStr = dist.toFixed(1);
    return lang === "bn" ? `${toBanglaNumber(kmStr)} কিমি` : `${kmStr} km`;
  };

  const formatHospitalType = (type: string) => {
    if (lang !== "bn") return type.replace(/_/g, " ");
    if (type === "government") return "সরকারি";
    if (type === "private") return "বেসরকারি";
    if (type === "clinic") return "ক্লিনিক";
    return type;
  };

  const openDirections = (hospital: Hospital) => {
    if (!hospital.latitude || !hospital.longitude) return;
    const label = encodeURIComponent(hospital.name);
    Linking.openURL(`geo:${hospital.latitude},${hospital.longitude}?q=${hospital.latitude},${hospital.longitude}(${label})`).catch(() => undefined);
  };

  const renderStars = (rating: number, onPress?: (star: number) => void) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          accessibilityLabel={`${star} ${lang === "bn" ? "তারকা" : "stars"}`}
          accessibilityRole={onPress ? "button" : "text"}
          disabled={!onPress}
          key={star}
          onPress={() => onPress?.(star)}
          style={onPress ? styles.starButton : styles.previewStarButton}
        >
          <Text style={[styles.starText, star <= rating && styles.starTextActive]}>{star <= rating ? "★" : "☆"}</Text>
        </Pressable>
      ))}
    </View>
  );

  const renderTabButton = (tab: HealthCenterTab, label: string, icon: "person" | "rate-review" | "local-hospital") => {
    const isActive = activeTab === tab;
    return (
      <Pressable
        accessibilityLabel={`Health Center tab ${tab}`}
        accessibilityRole="button"
        key={tab}
        onPress={() => setActiveTab(tab)}
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
      >
        <Icon name={icon} color={isActive ? colors.onPrimary : colors.onSurfaceVariant} size={18} />
        <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderAssignedChw = () => {
    if (pendingRequest?.status === "assigned" && pendingRequest.chw_id) {
      return (
        <View style={styles.assignedCard}>
          <View style={styles.cardLabelRow}>
            <Text style={styles.cardLabel}>{lang === "bn" ? "আমার স্বাস্থ্যকর্মী" : "My Assigned CHW"}</Text>
            <View style={styles.statusPill}>
              <Icon name="verified" color="#8B4A2B" size={14} />
              <Text style={styles.statusPillText}>{lang === "bn" ? "নিযুক্ত" : "Assigned"}</Text>
            </View>
          </View>

          <View style={styles.assignedMainRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{initialsForName(assignedChwName)}</Text>
            </View>
            <View style={styles.assignedInfo}>
              <Text style={styles.assignedName} numberOfLines={2}>{assignedChwName}</Text>
              <Text style={styles.assignedArea} numberOfLines={1}>
                {assignedChwArea ? `${assignedChwArea.upazila} • ${assignedChwArea.union_name}` : lang === "bn" ? "আপনার এলাকার স্বাস্থ্যকর্মী" : "Your area health worker"}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => setActiveTab("review")} style={styles.ratingPreview}>
                {renderStars(myReview?.rating ?? 0)}
                <Text style={styles.tapToRate}>{myReview ? (lang === "bn" ? "আপনার রেটিং" : "Your rating") : (lang === "bn" ? "রেটিং দিন" : "Tap to rate")}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable accessibilityLabel="Chat with assigned CHW" accessibilityRole="button" style={styles.chatButtonWide} onPress={handleOpenChat}>
            <Icon name="chat" color="#FFFFFF" size={18} />
            <Text style={styles.chatButtonWideText}>{lang === "bn" ? "চ্যাট করুন" : `Chat with ${assignedChwName.split(/\s+/)[0]}`}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={styles.requestNewRow}
            onPress={() => {
              if (!pendingReassignment) setActiveTab("review");
            }}
          >
            <View style={styles.requestNewIcon}>
              <Icon name={pendingReassignment ? "hourglass-empty" : "swap-horiz"} color="#4A6047" size={22} />
            </View>
            <View style={styles.requestNewTextWrap}>
              <Text style={styles.requestNewTitle}>
                {pendingReassignment ? (lang === "bn" ? "অনুরোধ পাঠানো হয়েছে" : "Request sent") : (lang === "bn" ? "নতুন স্বাস্থ্যকর্মী চাই" : "Request New CHW")}
              </Text>
              <Text style={styles.requestNewSubtitle}>
                {pendingReassignment ? (lang === "bn" ? "অ্যাডমিন আপনার অনুরোধ দেখবেন" : "Admin will review your request") : (lang === "bn" ? "রিভিউ ট্যাবে গিয়ে কারণ দিন" : "Use the review tab to submit a reason")}
              </Text>
            </View>
            <Icon name="chevron-right" color={colors.onSurfaceVariant} size={22} />
          </Pressable>
        </View>
      );
    }

    if (pendingRequest) {
      return (
        <View style={styles.stateCard}>
          <Icon name="hourglass-empty" color="#E57A58" size={28} />
          <Text style={styles.stateTitle}>{lang === "bn" ? "অনুরোধ প্রক্রিয়াধীন" : "Connection request pending"}</Text>
          <Text style={styles.stateBody}>{lang === "bn" ? "অ্যাডমিন অনুমোদন হওয়া পর্যন্ত অপেক্ষা করুন।" : "Waiting for admin assignment of a health worker."}</Text>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <Icon name="person-search" color="#E57A58" size={30} />
        <Text style={styles.stateTitle}>{lang === "bn" ? "স্বাস্থ্যকর্মী খুঁজুন" : "Find a CHW"}</Text>
        <Text style={styles.stateBody}>{lang === "bn" ? "কাছের স্বাস্থ্যকর্মী থেকে অনুরোধ পাঠান।" : "Choose a nearby health worker or request admin assignment."}</Text>
      </View>
    );
  };

  const renderChwTab = () => (
    <View style={styles.tabContent}>
      {renderAssignedChw()}

      {isOffline ? (
        <View style={styles.emptyContainer}>
          <Icon name="cloud-off" color="#A08E88" size={42} />
          <Text style={styles.emptyText}>{lang === "bn" ? "স্বাস্থ্যকর্মী খুঁজতে ইন্টারনেট সংযোগ করুন।" : "Connect to the internet to search for health workers."}</Text>
        </View>
      ) : nearbyChws.length > 0 ? (
        <View style={styles.listBlock}>
          <Text style={styles.blockTitle}>{lang === "bn" ? "কাছের স্বাস্থ্যকর্মী" : "Nearby CHWs"}</Text>
          {nearbyChws.map((chw) => (
            <View key={chw.chw_id} style={styles.chwCard}>
              <View style={styles.chwInfo}>
                <View style={styles.avatar}>
                  <Icon name="person" color="#FFFFFF" size={24} />
                </View>
                <View style={styles.chwDetails}>
                  <Text style={styles.chwName}>{formatChwName(chw.name, lang)}</Text>
                  <Text style={styles.chwArea}>{chw.union_name}, {chw.upazila}</Text>
                </View>
              </View>
              <View style={styles.chwActions}>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>{formatDistance(chw.distance_km)}</Text>
                </View>
                {!pendingRequest && (
                  <Pressable 
                    style={[styles.chatButton, { backgroundColor: '#4A6047' }]} 
                    onPress={() => handleRequestSpecificChw(chw.chw_id, chw.name)}
                  >
                    <Icon name="person-add" color="#FFFFFF" size={16} />
                    <Text style={styles.chatButtonText}>{lang === "bn" ? "অনুরোধ" : "Request"}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="location-off" color="#A08E88" size={42} />
          <Text style={styles.emptyText}>{lang === "bn" ? "১০ কিমির মধ্যে কোনো স্বাস্থ্যকর্মী পাওয়া যায়নি।" : "No active health workers found within 10 km."}</Text>
          {!pendingRequest && (
            <Pressable style={styles.requestButton} disabled={submitting} onPress={handleRequestChw}>
              <Text style={styles.requestButtonText}>
                {submitting ? (lang === "bn" ? "অনুরোধ পাঠানো হচ্ছে..." : "Submitting...") : (lang === "bn" ? "স্বাস্থ্যকর্মীর জন্য অনুরোধ করুন" : "Request a health worker")}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  const renderReviewTab = () => {
    if (pendingRequest?.status !== "assigned" || !pendingRequest.chw_id) {
      return (
        <View style={styles.stateCard}>
          <Icon name="rate-review" color="#E57A58" size={30} />
          <Text style={styles.stateTitle}>{lang === "bn" ? "রিভিউ দিতে স্বাস্থ্যকর্মী দরকার" : "Assign a CHW first"}</Text>
          <Text style={styles.stateBody}>{lang === "bn" ? "স্বাস্থ্যকর্মী নিযুক্ত হলে এখানে রেটিং ও রিভিউ দিতে পারবেন।" : "Once a CHW is assigned, you can rate and review them here."}</Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.reviewPanel}>
          <View style={styles.reviewHeader}>
            <View>
              <Text style={styles.reviewTitle}>{lang === "bn" ? "স্বাস্থ্যকর্মী রিভিউ" : "CHW Review"}</Text>
              <Text style={styles.reviewSub}>{assignedChwName}</Text>
            </View>
            {myReview && <Text style={styles.reviewSaved}>{lang === "bn" ? "আগে রিভিউ দেওয়া হয়েছে" : "Existing review"}</Text>}
          </View>
          {renderStars(reviewRating, setReviewRating)}
          <TextInput
            maxLength={300}
            multiline
            onChangeText={setReviewText}
            placeholder={lang === "bn" ? "ঐচ্ছিক রিভিউ লিখুন" : "Optional review"}
            placeholderTextColor={colors.onSurfaceVariant}
            style={styles.reviewInput}
            value={reviewText}
          />
          <View style={styles.reviewFooter}>
            <Text style={styles.charCount}>{reviewText.length}/300</Text>
            <Pressable disabled={reviewSubmitting} onPress={handleSubmitReview} style={styles.smallPrimaryButton}>
              <Text style={styles.smallPrimaryButtonText}>
                {reviewSubmitting ? (lang === "bn" ? "সংরক্ষণ..." : "Saving...") : myReview ? (lang === "bn" ? "রিভিউ আপডেট" : "Update review") : (lang === "bn" ? "রিভিউ দিন" : "Submit review")}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.reassignmentPanel}>
          <Text style={styles.reviewTitle}>{lang === "bn" ? "নতুন স্বাস্থ্যকর্মী চাই" : "Request New CHW"}</Text>
          {pendingReassignment ? (
            <View style={styles.pendingReassignmentBox}>
              <Icon name="hourglass-empty" color="#E57A58" size={20} />
              <Text style={styles.pendingReassignmentText}>{lang === "bn" ? "অনুরোধ পাঠানো হয়েছে" : "Request sent"}</Text>
            </View>
          ) : (
            <>
              {reassignmentOptions.map((option) => {
                const label = lang === "bn" ? option.labelBn : option.labelEn;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={option.key}
                    onPress={() => setReassignmentReason(option.key)}
                    style={[styles.reasonOption, reassignmentReason === option.key && styles.reasonOptionActive]}
                  >
                    <Text style={[styles.reasonText, reassignmentReason === option.key && styles.reasonTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
              <TextInput
                multiline
                onChangeText={setReassignmentNote}
                placeholder={lang === "bn" ? "ঐচ্ছিক নোট" : "Optional note"}
                placeholderTextColor={colors.onSurfaceVariant}
                style={styles.reviewInput}
                value={reassignmentNote}
              />
              <Pressable disabled={reassignmentSubmitting} onPress={handleSubmitReassignment} style={styles.requestButton}>
                <Text style={styles.requestButtonText}>
                  {reassignmentSubmitting ? (lang === "bn" ? "পাঠানো হচ্ছে..." : "Submitting...") : (lang === "bn" ? "অনুরোধ পাঠান" : "Send request")}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderHospitalsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchBox}>
        <Icon name="search" color={colors.onSurfaceVariant} size={20} />
        <TextInput
          editable={false}
          pointerEvents="none"
          placeholder={lang === "bn" ? "কাছের হাসপাতাল" : "Nearby hospitals"}
          placeholderTextColor={colors.onSurfaceVariant}
          style={styles.searchInput}
          value=""
        />
      </View>

      {hospitalsLoading ? (
        <View style={styles.loadingHospitals}>
          <ActivityIndicator size="small" color="#E57A58" />
          <Text style={styles.loadingText}>{lang === "bn" ? "হাসপাতাল লোড হচ্ছে..." : "Loading hospitals..."}</Text>
        </View>
      ) : hospitalsError ? (
        <View style={styles.emptyContainer}>
          <Icon name="local-hospital" color="#A08E88" size={42} />
          <Text style={styles.emptyText}>{hospitalsError}</Text>
        </View>
      ) : hospitals.length > 0 ? (
        hospitals.map((hospital) => (
          <View key={hospital.id} style={styles.hospitalCard}>
            <View style={styles.hospitalHeader}>
              <View style={styles.hospitalIconCircle}>
                <Icon name="local-hospital" color="#FFFFFF" size={22} />
              </View>
              <View style={styles.hospitalTitleWrap}>
                <Text style={styles.hospitalName} numberOfLines={2}>{hospital.name}</Text>
                <Text style={styles.hospitalArea} numberOfLines={1}>
                  {[hospital.upazila, hospital.district].filter(Boolean).join(", ") || (lang === "bn" ? "কাছের হাসপাতাল" : "Nearby hospital")}
                </Text>
              </View>
              <View style={styles.distanceBadgeGreen}>
                <Text style={styles.distanceTextGreen}>{formatDistance(hospital.distance_km)}</Text>
              </View>
            </View>

            <View style={styles.hospitalMetaRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{formatHospitalType(hospital.type)}</Text>
              </View>
              {hospital.is_partner ? (
                <View style={styles.partnerBadge}>
                  <Icon name="verified" color="#4A6047" size={14} />
                  <Text style={styles.partnerBadgeText}>{lang === "bn" ? "পার্টনার" : "Partner"}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.hospitalActions}>
              {hospital.phone ? (
                <Pressable accessibilityRole="button" style={styles.outlineButton} onPress={() => callPhoneNumber(hospital.phone || "")}>
                  <Icon name="phone" color="#4A6047" size={16} />
                  <Text style={styles.outlineButtonText}>{lang === "bn" ? "কল" : "Call"}</Text>
                </Pressable>
              ) : null}
              {hospital.latitude && hospital.longitude ? (
                <Pressable accessibilityRole="button" style={styles.outlineButton} onPress={() => openDirections(hospital)}>
                  <Icon name="directions" color="#4A6047" size={16} />
                  <Text style={styles.outlineButtonText}>{lang === "bn" ? "দিকনির্দেশ" : "Directions"}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="local-hospital" color="#A08E88" size={42} />
          <Text style={styles.emptyText}>{lang === "bn" ? "কাছাকাছি কোনো হাসপাতাল পাওয়া যায়নি।" : "No nearby hospitals found."}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{lang === "bn" ? "স্বাস্থ্য কেন্দ্র" : "Health Center"}</Text>
        <Text style={styles.headerSubtitle}>
          {lang === "bn" ? "স্বাস্থ্যকর্মী, রিভিউ ও কাছের হাসপাতাল" : "CHW support, reviews, and nearby hospitals"}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#E57A58" />
          <Text style={styles.loadingText}>{lang === "bn" ? "তথ্য লোড হচ্ছে..." : "Loading health center..."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <View style={styles.tabs}>
            {renderTabButton("chw", lang === "bn" ? "আমার স্বাস্থ্যকর্মী" : "My CHW", "person")}
            {renderTabButton("review", lang === "bn" ? "রিভিউ" : "Review", "rate-review")}
            {renderTabButton("hospitals", lang === "bn" ? "হাসপাতাল" : "Hospitals", "local-hospital")}
          </View>

          {activeTab === "chw" ? renderChwTab() : null}
          {activeTab === "review" ? renderReviewTab() : null}
          {activeTab === "hospitals" ? renderHospitalsTab() : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFF9F6",
    flex: 1
  },
  header: {
    borderBottomColor: "#F5ECE9",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  headerTitle: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: "bold"
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginTop: 2
  },
  loadingWrap: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center"
  },
  loadingText: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  listContent: {
    gap: 14,
    paddingBottom: 24,
    paddingHorizontal: 14,
    paddingTop: 12
  },
  tabs: {
    backgroundColor: "#F6EDE9",
    borderColor: "#EAD8CF",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4
  },
  tabButton: {
    alignItems: "center",
    borderRadius: radius.default,
    flex: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 6
  },
  tabButtonActive: {
    backgroundColor: "#E57A58"
  },
  tabText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "bold"
  },
  tabTextActive: {
    color: "#FFFFFF"
  },
  tabContent: {
    gap: spacing.base
  },
  assignedCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAD8CF",
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.base,
    padding: spacing.base
  },
  cardLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  cardLabel: {
    color: colors.onSurface,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  statusPill: {
    alignItems: "center",
    backgroundColor: "#FFF1E8",
    borderRadius: 14,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  statusPillText: {
    color: "#8B4A2B",
    fontSize: 11,
    fontWeight: "bold"
  },
  assignedMainRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.base
  },
  avatarLarge: {
    alignItems: "center",
    backgroundColor: "#2F8F8F",
    borderColor: "#F6D5C8",
    borderRadius: 24,
    borderWidth: 2,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold"
  },
  assignedInfo: {
    flex: 1,
    gap: 3
  },
  assignedName: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  assignedArea: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  ratingPreview: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    minHeight: 28
  },
  tapToRate: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "bold"
  },
  starsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2
  },
  previewStarButton: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 18
  },
  starButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  starText: {
    color: "#BDAEA8",
    fontSize: 24,
    fontWeight: "bold"
  },
  starTextActive: {
    color: "#E57A58"
  },
  chatButtonWide: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#A3522F",
    borderRadius: 22,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 28,
    width: "78%"
  },
  chatButtonWideText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  },
  requestNewRow: {
    alignItems: "center",
    backgroundColor: "#FFF9F6",
    borderColor: "#EAD8CF",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.sm
  },
  requestNewIcon: {
    alignItems: "center",
    backgroundColor: "#E4F1D8",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  requestNewTextWrap: {
    flex: 1
  },
  requestNewTitle: {
    color: colors.onSurface,
    fontSize: 13,
    fontWeight: "bold"
  },
  requestNewSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EAD8CF",
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  stateTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: "bold",
    textAlign: "center"
  },
  stateBody: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  listBlock: {
    gap: spacing.sm
  },
  blockTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  reviewPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAD8CF",
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.base
  },
  reviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  reviewTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  reviewSub: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginTop: 2
  },
  reviewSaved: {
    ...typography.caption,
    color: "#4A6047",
    fontWeight: "bold"
  },
  reviewInput: {
    ...typography.body,
    backgroundColor: "#FFF9F6",
    borderColor: "#F2E1DA",
    borderRadius: radius.default,
    borderWidth: 1,
    color: colors.onSurface,
    minHeight: 86,
    padding: spacing.sm,
    textAlignVertical: "top"
  },
  reviewFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  charCount: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  smallPrimaryButton: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    borderRadius: 20,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16
  },
  smallPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold"
  },
  reassignmentPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAD8CF",
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.base
  },
  reasonOption: {
    borderColor: "#F2E1DA",
    borderRadius: radius.default,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.sm
  },
  reasonOptionActive: {
    backgroundColor: "#FCEBE5",
    borderColor: "#E57A58"
  },
  reasonText: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    fontWeight: "bold"
  },
  reasonTextActive: {
    color: "#96482E"
  },
  pendingReassignmentBox: {
    alignItems: "center",
    backgroundColor: "#FFF5F2",
    borderColor: "#FFD9CE",
    borderRadius: radius.default,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.sm
  },
  pendingReassignmentText: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  chwCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EAD8CF",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.base
  },
  chwInfo: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.base
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  chwDetails: {
    flex: 1,
    gap: 2
  },
  chwName: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  chwArea: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  chwActions: {
    alignItems: "flex-end",
    gap: 6
  },
  distanceBadge: {
    backgroundColor: "#FCEBE5",
    borderRadius: radius.default,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  distanceText: {
    color: "#E57A58",
    fontSize: 12,
    fontWeight: "bold"
  },
  chatButton: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    borderRadius: radius.default,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 12
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold"
  },
  emptyContainer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EAD8CF",
    borderRadius: radius.card,
    borderWidth: 1,
    gap: 12,
    padding: spacing.lg
  },
  emptyText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  requestButton: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    borderRadius: 24,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    paddingHorizontal: 24
  },
  requestButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EAD8CF",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 46,
    paddingHorizontal: spacing.sm
  },
  searchInput: {
    ...typography.body,
    color: colors.onSurface,
    flex: 1,
    paddingVertical: 0
  },
  loadingHospitals: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EAD8CF",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 96,
    padding: spacing.base
  },
  hospitalCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAD8CF",
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.base
  },
  hospitalHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  hospitalIconCircle: {
    alignItems: "center",
    backgroundColor: "#4A6047",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  hospitalTitleWrap: {
    flex: 1
  },
  hospitalName: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  hospitalArea: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginTop: 2
  },
  distanceBadgeGreen: {
    backgroundColor: "#EDF4EB",
    borderRadius: radius.default,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  distanceTextGreen: {
    color: "#4A6047",
    fontSize: 12,
    fontWeight: "bold"
  },
  hospitalMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  typeBadge: {
    backgroundColor: "#F6EDE9",
    borderRadius: radius.default,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  typeBadgeText: {
    color: "#8B4A2B",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize"
  },
  partnerBadge: {
    alignItems: "center",
    backgroundColor: "#EDF4EB",
    borderRadius: radius.default,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  partnerBadgeText: {
    color: "#4A6047",
    fontSize: 12,
    fontWeight: "bold"
  },
  hospitalActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  outlineButton: {
    alignItems: "center",
    borderColor: "#C9D9C1",
    borderRadius: radius.default,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12
  },
  outlineButtonText: {
    color: "#4A6047",
    fontSize: 12,
    fontWeight: "bold"
  }
});
