import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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

const DEMO_MOTHER_IDS = new Set(["60000000-0000-0000-0000-000000000002", "mother-demo-id"]);
const DEMO_CHW: CHW = {
  chw_id: "00000000-0000-0000-0000-0000000000a1",
  name: "মোছাঃ জাহানারা বেগম (Jahanara)",
  union_name: "ভল্লবপুর",
  upazila: "নরসিংদী সদর",
  distance_km: 1.25,
  latitude: 23.8183,
  longitude: 90.4075
};

function isDemoMother(motherId: string | null | undefined) {
  return Boolean(motherId && DEMO_MOTHER_IDS.has(motherId));
}

export default function FindChwScreen() {
  const { language: lang } = useLanguage();
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

  const setDemoChwState = (mId: string) => {
    setCoords({ latitude: 23.8103, longitude: 90.4125 });
    setNearbyChws([DEMO_CHW]);
    setPendingRequest({
      id: "demo-req-1",
      status: "assigned",
      chw_id: DEMO_CHW.chw_id,
      chws: { name: DEMO_CHW.name }
    });
    setMyReview({ id: "demo-review-1", rating: 5, review_text: "" });
    setReviewRating(5);
    setReviewText("");
    setPendingReassignment(null);
    setMotherId(mId);
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

  const fetchRequestStatus = async (mId: string) => {
    if (isDemoMother(mId)) {
      setPendingRequest({
        id: "demo-req-1",
        status: "assigned",
        chw_id: DEMO_CHW.chw_id,
        chws: { name: DEMO_CHW.name }
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

      await fetchRequestStatus(profile.id);

      if (offline) {
        setNearbyChws([]);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          lang === "bn" ? "অনুমতি প্রয়োজন" : "Permission Required",
          lang === "bn"
            ? "স্বাস্থ্যকর্মীদের দূরত্ব দেখার জন্য লোকেশন পারমিশন প্রয়োজন।"
            : "Location permission is required to find nearby health workers."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const currentCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCoords(currentCoords);

      const { data, error } = await supabase.rpc("find_nearby_chws", {
        mother_lat: currentCoords.latitude,
        mother_lng: currentCoords.longitude,
        radius_km: 10.0
      });

      if (error) throw error;
      setNearbyChws(data || []);
    } catch (err) {
      console.error("Failed to load matching CHWs:", err);
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
    if (!motherId || !coords) return;
    setSubmitting(true);
    try {
      const pointWkt = `POINT(${coords.longitude} ${coords.latitude})`;
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
    if (isDemoMother(motherId)) {
      const demoReview = { id: myReview?.id ?? "demo-review-1", rating: reviewRating, review_text: cleanText || null };
      setMyReview(demoReview);
      Alert.alert(lang === "bn" ? "রিভিউ সংরক্ষিত" : "Review saved", lang === "bn" ? "আপনার রিভিউ আপডেট হয়েছে।" : "Your review has been updated.");
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
      const { data, error } = myReview
        ? await query.update(payload).eq("id", myReview.id).select("id,rating,review_text").single()
        : await query.insert(payload).select("id,rating,review_text").single();
      if (error) throw error;
      setMyReview(data as ChwReview);
      Alert.alert(lang === "bn" ? "রিভিউ সংরক্ষিত" : "Review saved", lang === "bn" ? "আপনার রিভিউ সংরক্ষণ করা হয়েছে।" : "Your review has been saved.");
    } catch (err: any) {
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
    const kmStr = dist.toFixed(2);
    return lang === "bn" ? `${toBanglaNumber(kmStr)} কি.মি.` : `${kmStr} km`;
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{lang === "bn" ? "স্বাস্থ্যকেন্দ্র" : "Health Centers"}</Text>
        <Text style={styles.headerSubtitle}>
          {lang === "bn"
            ? "স্বাস্থ্যকর্মী খুঁজুন, আর হাসপাতাল ও ডাক্তার সার্চের জায়গা দেখুন"
            : "Find CHWs now, with hospital and doctor search coming soon"}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#E57A58" />
          <Text style={styles.loadingText}>{lang === "bn" ? "তথ্য লোড হচ্ছে..." : "Loading health center options..."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Icon name="person-search" color="#FFFFFF" size={22} />
              </View>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>{lang === "bn" ? "স্বাস্থ্যকর্মী খুঁজুন" : "Find CHW"}</Text>
                <Text style={styles.sectionSubtitle}>
                  {lang === "bn" ? "আপনার কাছের স্বাস্থ্যকর্মীর সাথে যোগাযোগ করুন" : "Connect with a nearby health worker"}
                </Text>
              </View>
            </View>

            {pendingRequest && (
              <View style={[styles.alertBanner, pendingRequest.status === "assigned" && styles.alertBannerAssigned]}>
                <Icon name={pendingRequest.status === "assigned" ? "check-circle" : "hourglass-empty"} color={pendingRequest.status === "assigned" ? "#4A6047" : "#E57A58"} size={22} />
                <View style={styles.alertTextWrap}>
                  <Text style={styles.alertTitle}>
                    {pendingRequest.status === "assigned"
                      ? lang === "bn" ? "স্বাস্থ্যকর্মী নিযুক্ত করা হয়েছে" : "Health worker assigned"
                      : lang === "bn" ? "অনুরোধ প্রক্রিয়াধীন" : "Connection request pending"}
                  </Text>
                  <Text style={styles.alertDesc}>
                    {pendingRequest.status === "assigned"
                      ? lang === "bn"
                        ? `${pendingRequest.chws?.name} আপনার অনুরোধ গ্রহণ করেছেন।`
                        : `${pendingRequest.chws?.name} has been assigned to help you.`
                      : lang === "bn"
                        ? "অ্যাডমিন অনুমোদন হওয়া পর্যন্ত অপেক্ষা করুন।"
                        : "Waiting for admin assignment of a health worker."}
                  </Text>
                </View>
                {pendingRequest.status === "assigned" && pendingRequest.chw_id && (
                  <Pressable style={styles.alertChatBtn} onPress={handleOpenChat}>
                    <Icon name="chat" color="#FFFFFF" size={18} />
                  </Pressable>
                )}
              </View>
            )}

            {pendingRequest?.status === "assigned" && pendingRequest.chw_id && (
              <View style={styles.reviewPanel}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewTitle}>{lang === "bn" ? "স্বাস্থ্যকর্মী রিভিউ" : "CHW Review"}</Text>
                  {myReview && <Text style={styles.reviewSaved}>{lang === "bn" ? "আগে রিভিউ দেওয়া হয়েছে" : "Existing review"}</Text>}
                </View>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      accessibilityRole="button"
                      key={star}
                      onPress={() => setReviewRating(star)}
                      style={styles.starButton}
                    >
                      <Text style={[styles.starText, star <= reviewRating && styles.starTextActive]}>★</Text>
                    </Pressable>
                  ))}
                </View>
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
            )}

            {pendingRequest?.status === "assigned" && pendingRequest.chw_id && (
              <View style={styles.reassignmentPanel}>
                <Text style={styles.reviewTitle}>{lang === "bn" ? "নতুন স্বাস্থ্যকর্মী চাই" : "Request New CHW"}</Text>
                {pendingReassignment ? (
                  <View style={styles.pendingReassignmentBox}>
                    <Icon name="hourglass-empty" color="#E57A58" size={20} />
                    <Text style={styles.pendingReassignmentText}>অনুরোধ পাঠানো হয়েছে</Text>
                  </View>
                ) : (
                  <>
                    {[
                      { key: "not_responding" as const, label: "স্বাস্থ্যকর্মী যোগাযোগ করছেন না" },
                      { key: "moved_area" as const, label: "ভিন্ন এলাকায় চলে গেছি" },
                      { key: "other" as const, label: "অন্য কারণ" }
                    ].map((option) => (
                      <Pressable
                        key={option.key}
                        onPress={() => setReassignmentReason(option.key)}
                        style={[styles.reasonOption, reassignmentReason === option.key && styles.reasonOptionActive]}
                      >
                        <Text style={[styles.reasonText, reassignmentReason === option.key && styles.reasonTextActive]}>{option.label}</Text>
                      </Pressable>
                    ))}
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
                        {reassignmentSubmitting ? (lang === "bn" ? "পাঠানো হচ্ছে..." : "Submitting...") : (lang === "bn" ? "Request New CHW" : "Request New CHW")}
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}

            {isOffline ? (
              <View style={styles.emptyContainer}>
                <Icon name="cloud-off" color="#A08E88" size={42} />
                <Text style={styles.emptyText}>
                  {lang === "bn" ? "স্বাস্থ্যকর্মী খুঁজতে ইন্টারনেট সংযোগ করুন।" : "Connect to the internet to search for health workers."}
                </Text>
              </View>
            ) : nearbyChws.length > 0 ? (
              nearbyChws.map((chw) => (
                <View key={chw.chw_id} style={styles.chwCard}>
                  <View style={styles.chwInfo}>
                    <View style={styles.avatar}>
                      <Icon name="person" color="#FFFFFF" size={24} />
                    </View>
                    <View style={styles.chwDetails}>
                      <Text style={styles.chwName}>{chw.name}</Text>
                      <Text style={styles.chwArea}>{chw.union_name}, {chw.upazila}</Text>
                    </View>
                  </View>
                  <View style={styles.chwActions}>
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{formatDistance(chw.distance_km)}</Text>
                    </View>
                    <Pressable style={styles.chatButton} onPress={handleOpenChat}>
                      <Icon name="chat" color="#FFFFFF" size={16} />
                      <Text style={styles.chatButtonText}>{lang === "bn" ? "চ্যাট" : "Chat"}</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="location-off" color="#A08E88" size={42} />
                <Text style={styles.emptyText}>
                  {lang === "bn" ? "১০ কি.মি.-এর মধ্যে কোনো স্বাস্থ্যকর্মী পাওয়া যায়নি।" : "No active health workers found within 10 km."}
                </Text>
                {!pendingRequest && (
                  <Pressable style={styles.requestButton} disabled={submitting} onPress={handleRequestChw}>
                    <Text style={styles.requestButtonText}>
                      {submitting
                        ? lang === "bn" ? "অনুরোধ পাঠানো হচ্ছে..." : "Submitting..."
                        : lang === "bn" ? "স্বাস্থ্যকর্মীর জন্য অনুরোধ করুন" : "Request a health worker"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.hospitalIcon]}>
                <Icon name="local-hospital" color="#FFFFFF" size={22} />
              </View>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>{lang === "bn" ? "Nearby Hospitals" : "Nearby Hospitals"}</Text>
                <Text style={styles.sectionSubtitle}>
                  {lang === "bn" ? "হাসপাতাল ও ডাক্তার সার্চ শীঘ্রই যুক্ত হবে" : "Hospital and doctor search will be added soon"}
                </Text>
              </View>
            </View>

            <View style={styles.comingSoonPanel}>
              <View style={styles.searchBox}>
                <Icon name="search" color={colors.onSurfaceVariant} size={20} />
                <TextInput
                  editable={false}
                  pointerEvents="none"
                  placeholder={lang === "bn" ? "হাসপাতাল বা ডাক্তার খুঁজুন" : "Search hospitals or doctors"}
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={styles.searchInput}
                  value=""
                />
              </View>

              <View style={styles.comingSoonCard}>
                <Icon name="construction" color={colors.primary} size={30} />
                <View style={styles.comingSoonTextWrap}>
                  <Text style={styles.comingSoonTitle}>{lang === "bn" ? "Coming soon" : "Coming soon"}</Text>
                  <Text style={styles.comingSoonBody}>
                    {lang === "bn"
                      ? "এখানে কাছের হাসপাতাল, ক্লিনিক এবং ডাক্তারদের তালিকা সার্চ করা যাবে।"
                      : "This area will let you search nearby hospitals, clinics, and doctors."}
                  </Text>
                </View>
              </View>
            </View>
          </View>
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
    paddingHorizontal: 20,
    paddingBottom: 24
  },
  section: {
    gap: spacing.sm
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  sectionIcon: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  hospitalIcon: {
    backgroundColor: "#4A6047"
  },
  sectionTitleWrap: {
    flex: 1,
    gap: 2
  },
  sectionTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  alertBanner: {
    alignItems: "center",
    backgroundColor: "#FFF5F2",
    borderColor: "#FFD9CE",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.base
  },
  alertBannerAssigned: {
    backgroundColor: "#EDF4EB",
    borderColor: "#DCE8D7"
  },
  alertTextWrap: {
    flex: 1,
    gap: 2
  },
  alertTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  alertDesc: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  },
  alertChatBtn: {
    alignItems: "center",
    backgroundColor: "#4A6047",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  reviewPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F2EBE8",
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.base
  },
  reviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  reviewTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  reviewSaved: {
    ...typography.caption,
    color: "#4A6047",
    fontWeight: "bold"
  },
  starsRow: {
    flexDirection: "row",
    gap: 4
  },
  starButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  starText: {
    color: "#D5C7C1",
    fontSize: 28,
    fontWeight: "bold"
  },
  starTextActive: {
    color: "#E57A58"
  },
  reviewInput: {
    ...typography.body,
    backgroundColor: "#FFF9F6",
    borderColor: "#F2EBE8",
    borderRadius: radius.default,
    borderWidth: 1,
    color: colors.onSurface,
    minHeight: 82,
    padding: spacing.sm,
    textAlignVertical: "top"
  },
  reviewFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm
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
    borderColor: "#F2EBE8",
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.base
  },
  reasonOption: {
    borderColor: "#F2EBE8",
    borderRadius: radius.default,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
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
    color: "#96482e"
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
    borderColor: "#F2EBE8",
    borderRadius: radius.card,
    borderWidth: 1,
    elevation: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.base,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
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
    gap: 12,
    paddingVertical: 28
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
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 24
  },
  requestButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  },
  comingSoonPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F2EBE8",
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.base
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#FFF9F6",
    borderColor: "#F2EBE8",
    borderRadius: radius.default,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.sm
  },
  searchInput: {
    ...typography.body,
    color: colors.onSurface,
    flex: 1,
    paddingVertical: 0
  },
  comingSoonCard: {
    alignItems: "center",
    backgroundColor: "#EDF4EB",
    borderColor: "#DCE8D7",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.base
  },
  comingSoonTextWrap: {
    flex: 1,
    gap: 2
  },
  comingSoonTitle: {
    ...typography.body,
    color: colors.onSurface,
    fontWeight: "bold"
  },
  comingSoonBody: {
    ...typography.caption,
    color: colors.onSurfaceVariant
  }
});
