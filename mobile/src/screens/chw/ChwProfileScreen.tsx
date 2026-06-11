import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View, Image, Platform, TextInput, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { Icon } from "@/components/ui/Icon";
import { clearRoleSession } from "@/auth/roleSession";
import { getSession, clearSession } from "@/auth/secureSession";
import { supabase } from "@/auth/supabaseAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useCopy } from "@/data/useCopy";
import { getLocalDbErrorMessage } from "@/db/localDbAccess";
import { getPatients } from "@/db/patients";
import { getVisitCountForChwSince } from "@/db/visits";
import { formatNumber } from "@/utils/localizedFormat";

type ChwProfileRow = {
  id: string;
  name: string | null;
  district: string | null;
  upazila: string | null;
  union_name: string | null;
  location: string | null;
};

type ChwReviewRow = {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  mother?: { name: string | null } | null;
};

export default function ChwProfileScreen() {
  const { language, setLanguage, t } = useLanguage();
  const copy = useCopy();

  const [name, setName] = useState<string>("Rahela Begum");
  const [patientCount, setPatientCount] = useState(8);
  const [visitCount, setVisitCount] = useState(42);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviews, setReviews] = useState<ChwReviewRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Location details states
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [unionName, setUnionName] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const parseCoordinates = (locVal: any): { lat: number; lng: number } | null => {
    if (!locVal) return null;
    if (typeof locVal === "string") {
      const match = locVal.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (match) {
        return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
      }
    } else if (typeof locVal === "object") {
      if (Array.isArray(locVal.coordinates) && locVal.coordinates.length >= 2) {
        return { lng: locVal.coordinates[0], lat: locVal.coordinates[1] };
      }
      if (typeof locVal.lat === "number" && typeof locVal.lng === "number") {
        return { lat: locVal.lat, lng: locVal.lng };
      }
      if (typeof locVal.latitude === "number" && typeof locVal.longitude === "number") {
        return { lat: locVal.latitude, lng: locVal.longitude };
      }
    }
    return null;
  };

  const formatCoordinates = (locVal: any) => {
    const coords = parseCoordinates(locVal);
    if (!coords) return language === "en" ? "Not set" : "সেট করা নেই";
    return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
  };

  const displayLocation = () => {
    const parts = [unionName, upazila, district].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    return language === "en" ? "Not set" : "সেট করা নেই";
  };

  const fetchCurrentGps = async () => {
    setIsGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          language === "en" ? "Permission Denied" : "অনুমতি অস্বীকৃত",
          language === "en"
            ? "MaaSheba needs location permissions to update your GPS coordinates."
            : "জিপিএস স্থানাঙ্ক আপডেট করতে মাসেবা অ্যাপের লোকেশন অনুমতি প্রয়োজন।"
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationPoint = `POINT(${loc.coords.longitude} ${loc.coords.latitude})`;
      setLocation(locationPoint);

      // Reverse geocode to auto-fill input fields
      try {
        const addressList = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });

        if (addressList && addressList.length > 0) {
          const addr = addressList[0];
          const detectedDistrict = addr.district || addr.subregion || addr.region || "";
          const detectedUpazila = addr.city || addr.subregion || "";
          const detectedUnion = addr.name || addr.street || addr.subregion || "";

          setDistrict(detectedDistrict);
          setUpazila(detectedUpazila);
          setUnionName(detectedUnion);
        }
      } catch (geocodingErr) {
        console.warn("Reverse geocoding failed:", geocodingErr);
      }

      Alert.alert(
        language === "en" ? "Success" : "সফলতা",
        language === "en"
          ? `GPS coordinates retrieved successfully: ${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`
          : `জিপিএস স্থানাঙ্ক সফলভাবে পাওয়া গেছে: ${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`
      );
    } catch (err) {
      console.error("Error fetching GPS:", err);
      Alert.alert(
        language === "en" ? "Error" : "ত্রুটি",
        language === "en"
          ? "Failed to get current GPS location. Please make sure location services are enabled."
          : "বর্তমান জিপিএস অবস্থান পাওয়া যায়নি। অনুগ্রহ করে আপনার জিপিএস চালু আছে কিনা নিশ্চিত করুন।"
      );
    } finally {
      setIsGpsLoading(false);
    }
  };

  const saveLocation = async () => {
    setIsSaving(true);
    try {
      const session = await getSession();
      if (!session) {
        Alert.alert(
          language === "en" ? "Session Expired" : "সেশন শেষ",
          language === "en" ? "Please log in again." : "অনুগ্রহ করে আবার লগইন করুন।"
        );
        return;
      }

      const { error } = await supabase
        .from("chws")
        .update({
          district: district.trim() || null,
          upazila: upazila.trim() || null,
          union_name: unionName.trim() || null,
          location: location || null
        })
        .eq("id", session.chwId);

      if (error) {
        throw error;
      }

      Alert.alert(
        language === "en" ? "Success" : "সফলতা",
        language === "en" ? "Location updated successfully." : "অবস্থান সফলভাবে আপডেট করা হয়েছে।"
      );
    } catch (err: any) {
      console.error("Error saving location:", err);
      Alert.alert(
        language === "en" ? "Error" : "ত্রুটি",
        language === "en"
          ? `Failed to save location: ${err.message || err}`
          : "অবস্থান সংরক্ষণ করতে ব্যর্থ হয়েছে।"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const session = await getSession();
      if (!session) return;

      const startOfWeek = new Date();
      const day = startOfWeek.getDay();
      const diff = day === 0 ? 6 : day - 1;
      startOfWeek.setDate(startOfWeek.getDate() - diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const [patients, visitsThisWeek, profileResponse, reviewResponse] = await Promise.all([
        getPatients(),
        getVisitCountForChwSince(session.chwId, startOfWeek.toISOString()),
        supabase.from("chws").select("id,name,district,upazila,union_name,location").eq("id", session.chwId).maybeSingle<ChwProfileRow>(),
        supabase
          .from("chw_reviews")
          .select("id,rating,review_text,created_at,mother:mothers(name)")
          .eq("chw_id", session.chwId)
          .neq("status", "removed")
          .order("created_at", { ascending: false })
      ]);

      if (patients.length > 0) {
        setPatientCount(patients.length);
      } else {
        setPatientCount(8);
      }

      if (visitsThisWeek > 0) {
        setVisitCount(visitsThisWeek);
      } else {
        setVisitCount(42);
      }

      if (!profileResponse.error && profileResponse.data) {
        const dbName = profileResponse.data.name;
        if (dbName) {
          if (dbName === "CHW_A") {
            setName(language === "en" ? "Rahela Begum" : "রাহেলা বেগম");
          } else if (dbName === "CHW_B") {
            setName(language === "en" ? "Mst. Sufia Khatun" : "মোসাঃ সুফিয়া খাতুন");
          } else if (dbName.startsWith("CHW_")) {
            setName(language === "en" ? `Health Worker ${dbName.replace("CHW_", "")}` : `স্বাস্থ্যকর্মী ${dbName.replace("CHW_", "")}`);
          } else {
            setName(dbName);
          }
        }
        
        setDistrict(profileResponse.data.district || "");
        setUpazila(profileResponse.data.upazila || "");
        setUnionName(profileResponse.data.union_name || "");
        setLocation(profileResponse.data.location || null);
      }

      if (!reviewResponse.error && reviewResponse.data) {
        const rows = reviewResponse.data as unknown as ChwReviewRow[];
        setReviews(rows);
        setReviewCount(rows.length);
        setAverageRating(rows.length ? rows.reduce((total, item) => total + item.rating, 0) / rows.length : 0);
      }
    } catch (e) {
      setPatientCount(8);
      setVisitCount(42);
    }
  }, [language]);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        setLoadError(getLocalDbErrorMessage(error, copy.common.loadFailed));
      });
    }, [load, copy.common.loadFailed])
  );

  const showInfo = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: copy.common.close }]);
  };

  const toggleLanguage = () => {
    void setLanguage(language === "bn" ? "en" : "bn");
  };

  const confirmLogout = () => {
    Alert.alert(
      language === "en" ? "Log Out" : "লগ আউট", 
      language === "en" ? "Are you sure you want to log out of your account?" : "আপনি কি নিশ্চিতভাবে আপনার অ্যাকাউন্ট থেকে লগ আউট করতে চান?", 
      [
        { text: language === "en" ? "Cancel" : "বাতিল", style: "cancel" },
        {
          text: language === "en" ? "Log Out" : "লগ আউট",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } finally {
              await Promise.all([clearSession(), clearRoleSession()]);
              router.replace("/(auth)/login");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.screen}>
      {/* Top Clinical Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.stethoscopeCircle}>
            <Icon name="medical-services" color="#E57A58" size={20} />
          </View>
          <View style={styles.topBarTextWrap}>
            <Text style={styles.headerTitle}>{copy.common.appName}</Text>
            <Text style={styles.headerSubtitle}>{name} • {language === "en" ? "Health Worker" : "স্বাস্থ্যকর্মী"}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Redesigned Clinician ID Card */}
        <View style={styles.identityCard}>
          <View style={styles.identityCardHeader}>
            <View style={styles.badgeStethoscopeCircle}>
              <Icon name="health-and-safety" color="#FFFFFF" size={22} />
            </View>
            <View style={styles.activeStatusRow}>
              <View style={styles.activeStatusDot} />
              <Text style={styles.activeStatusText}>
                {language === "en" ? "Active Health Worker" : "সক্রিয় স্বাস্থ্যকর্মী"}
              </Text>
            </View>
          </View>

          <View style={styles.identityCardBody}>
            <View style={styles.clinicianAvatarWrap}>
              <View style={styles.clinicianAvatar}>
                <Text style={styles.clinicianAvatarText}>
                  {language === "en" ? name.split(" ").map(p => p[0]).join("").slice(0, 2) : name.slice(0, 2)}
                </Text>
              </View>
              <View style={styles.identityVerifiedBadge}>
                <Icon name="verified" color="#FFFFFF" size={12} />
              </View>
            </View>

            <View style={styles.clinicianDetails}>
              <Text style={styles.clinicianNameText}>{name}</Text>
              <Text style={styles.clinicianRoleText}>
                {language === "en" ? "Senior Health Worker (CHW-Senior)" : "সিনিয়র স্বাস্থ্যকর্মী (CHW-Senior)"}
              </Text>
              <Text style={styles.clinicianIdText}>
                {language === "en" ? "ID: CHW-88291" : "আইডি: CHW-88291"}
              </Text>
            </View>
          </View>

          <View style={styles.identityCardDivider} />

          <View style={styles.identityCardFooter}>
            <View style={styles.footerDetailRow}>
              <Icon name="location-on" color="#A08E88" size={14} />
              <Text style={styles.footerDetailText}>
                {language === "en" ? "Comilla Region" : "কুমিল্লা অঞ্চল"}
              </Text>
            </View>
            <View style={styles.footerDetailRow}>
              <Icon name="calendar-today" color="#A08E88" size={14} />
              <Text style={styles.footerDetailText}>
                {language === "en" ? "Joined: 12 March 2024" : "যোগদান: ১২ মার্চ ২০২৪"}
              </Text>
            </View>
          </View>
        </View>

        {/* Performance stats section */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Icon name="trending-up" color="#70605A" size={16} />
            <Text style={styles.sectionTitle}>
              {language === "en" ? "Performance & Statistics" : "প্রদর্শন ও পরিসংখ্যান"}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            {/* Card 1: Today's Patients */}
            <View style={[styles.statCard, styles.statCardTerracotta]}>
              <View style={styles.statCardHeaderRow}>
                <Icon name="people" color="#E57A58" size={20} />
                <Text style={[styles.statValue, styles.textTerracotta]}>
                  {formatNumber(patientCount, language)}
                </Text>
              </View>
              <Text style={styles.statLabel}>{copy.chwDashboard.todaysPatients}</Text>
            </View>

            {/* Card 2: Weekly Visits */}
            <View style={[styles.statCard, styles.statCardGreen]}>
              <View style={styles.statCardHeaderRow}>
                <Icon name="assignment" color="#4A6047" size={20} />
                <Text style={[styles.statValue, styles.textGreen]}>
                  {formatNumber(visitCount, language)}
                </Text>
              </View>
              <Text style={styles.statLabel}>{copy.chwProfile.visitsThisWeek}</Text>
            </View>
          </View>
        </View>

        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeader}>
            <Icon name="star" color="#70605A" size={16} />
            <Text style={styles.sectionTitle}>
              {language === "en" ? "Mother Reviews" : "মায়ের রিভিউ"}
            </Text>
          </View>
          <View style={styles.ratingSummaryCard}>
            <Text style={styles.ratingValue}>{averageRating.toFixed(1)} ★</Text>
            <Text style={styles.ratingLabel}>
              {language === "en"
                ? `${formatNumber(reviewCount, language)} reviews`
                : `${formatNumber(reviewCount, language)}টি রিভিউ`}
            </Text>
          </View>
          {reviews.slice(0, 5).map((review) => {
            const motherName = review.mother?.name?.trim();
            const firstName = motherName ? motherName.split(/\s+/)[0] : language === "en" ? "Ma" : "মা";
            return (
              <View style={styles.reviewCard} key={review.id}>
                <View style={styles.reviewCardHeader}>
                  <Text style={styles.reviewAuthor}>{firstName}</Text>
                  <Text style={styles.reviewStars}>{review.rating} ★</Text>
                </View>
                {review.review_text ? <Text style={styles.reviewText}>{review.review_text}</Text> : null}
                <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
              </View>
            );
          })}
          {reviews.length === 0 && (
            <Text style={styles.noReviewsText}>
              {language === "en" ? "No reviews yet." : "এখনও কোনো রিভিউ নেই।"}
            </Text>
          )}
        </View>

        {/* Location Update Section */}
        <View style={styles.locationSection}>
          <View style={styles.sectionHeader}>
            <Icon name="location-on" color="#70605A" size={16} />
            <Text style={styles.sectionTitle}>
              {language === "en" ? "Update Location" : "অবস্থান আপডেট করুন"}
            </Text>
          </View>
          <View style={styles.locationCard}>
            {/* District Input */}
            <Text style={styles.inputLabel}>{language === "en" ? "District" : "জেলা"}</Text>
            <TextInput
              style={styles.locationInput}
              value={district}
              onChangeText={setDistrict}
              placeholder={language === "en" ? "Enter District" : "জেলা লিখুন"}
              placeholderTextColor="#A08E88"
            />

            {/* Upazila Input */}
            <Text style={styles.inputLabel}>{language === "en" ? "Upazila" : "উপজেলা"}</Text>
            <TextInput
              style={styles.locationInput}
              value={upazila}
              onChangeText={setUpazila}
              placeholder={language === "en" ? "Enter Upazila" : "উপজেলা লিখুন"}
              placeholderTextColor="#A08E88"
            />

            {/* Union Input */}
            <Text style={styles.inputLabel}>{language === "en" ? "Union / Area" : "ইউনিয়ন / এলাকা"}</Text>
            <TextInput
              style={styles.locationInput}
              value={unionName}
              onChangeText={setUnionName}
              placeholder={language === "en" ? "Enter Union or Area" : "ইউনিয়ন বা এলাকা লিখুন"}
              placeholderTextColor="#A08E88"
            />

            {/* GPS Coordinates Display */}
            <View style={styles.gpsDisplayRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{language === "en" ? "GPS Coordinates" : "জিপিএস স্থানাঙ্ক"}</Text>
                <Text style={styles.gpsValueText}>
                  {formatCoordinates(location)}
                </Text>
              </View>
              <Pressable
                onPress={() => void fetchCurrentGps()}
                disabled={isGpsLoading}
                style={({ pressed }) => [
                  styles.gpsBtn,
                  pressed && styles.btnPressed,
                  isGpsLoading && styles.btnDisabled
                ]}
              >
                {isGpsLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="gps-fixed" color="#FFFFFF" size={14} />
                    <Text style={styles.gpsBtnText}>
                      {language === "en" ? "Get GPS" : "জিপিএস নিন"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={() => void saveLocation()}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && styles.btnPressed,
                isSaving && styles.btnDisabled
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="save" color="#FFFFFF" size={18} />
                  <Text style={styles.saveBtnText}>
                    {language === "en" ? "Save Changes" : "পরিবর্তন সংরক্ষণ করুন"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Actions Card List Panel */}
        <View style={styles.actionsCard}>


          {/* Edit Profile */}
          <Pressable
            onPress={() => showInfo(
              language === "en" ? "Edit Profile" : "প্রোফাইল সম্পাদনা", 
              language === "en" ? "Please contact the main office to edit profile details." : "প্রোফাইল বিবরণ সম্পাদনা করার জন্য প্রধান কার্যালয়ে যোগাযোগ করুন।"
            )}
            style={styles.actionRow}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrap}>
                <Icon name="person" color="#70605A" size={18} />
              </View>
              <Text style={styles.actionText}>{copy.chwProfile.edit}</Text>
            </View>
            <Icon name="chevron-right" color="#A08E88" size={18} />
          </Pressable>

          <View style={styles.divider} />

          {/* Clinical Guideline */}
          <Pressable
            onPress={() => showInfo(
              language === "en" ? "Clinical Guideline" : "ক্লিনিক্যাল নির্দেশিকা", 
              language === "en" ? "Maternal and child health guidelines & health worker referral guidelines are downloading." : "মাতা ও শিশু স্বাস্থ্য নির্দেশিকা ও স্বাস্থ্যকর্মীর রেফারেল গাইডলাইন ডাউনলোড হচ্ছে।"
            )}
            style={styles.actionRow}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrap}>
                <Icon name="book" color="#70605A" size={18} />
              </View>
              <Text style={styles.actionText}>{copy.chwProfile.guide}</Text>
            </View>
            <Icon name="chevron-right" color="#A08E88" size={18} />
          </Pressable>

          <View style={styles.divider} />

          {/* Language Switch */}
          <Pressable onPress={toggleLanguage} style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrap}>
                <Icon name="language" color="#70605A" size={18} />
              </View>
              <View>
                <Text style={styles.actionText}>{t("profile.language")}</Text>
                <Text style={styles.actionSubText}>{t("chw.profile.languageValue")}</Text>
              </View>
            </View>
            <Icon name="chevron-right" color="#A08E88" size={18} />
          </Pressable>

          <View style={styles.divider} />

          {/* Help Center */}
          <Pressable
            onPress={() => showInfo(
              language === "en" ? "Help Center" : "সহায়তা কেন্দ্র", 
              language === "en" ? "To connect with MaaSheba clinical support service line, call 16789." : "মাসেবা ক্লিনিক্যাল সাপোর্ট সার্ভিস লাইনে যুক্ত হতে কল করুন ১৬৭৮৯ নম্বরে।"
            )}
            style={styles.actionRow}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrap}>
                <Icon name="help-outline" color="#70605A" size={18} />
              </View>
              <Text style={styles.actionText}>{language === "en" ? "Help Center" : "সহায়তা কেন্দ্র"}</Text>
            </View>
            <Icon name="chevron-right" color="#A08E88" size={18} />
          </Pressable>

          <View style={styles.divider} />

          {/* Logout */}
          <Pressable
            onPress={confirmLogout}
            style={[styles.actionRow, styles.actionRowLast]}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconWrap, styles.actionIconWrapRed]}>
                <Icon name="logout" color="#B3261E" size={18} />
              </View>
              <Text style={[styles.actionText, styles.textRed]}>{copy.common.logout}</Text>
            </View>
            <Icon name="chevron-right" color="#E57A58" size={18} />
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFF9F6", // Cream background
    flex: 1
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "#FFF9F6",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 52, android: 56, default: 12 }),
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE9"
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  stethoscopeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FCEBE5",
    alignItems: "center",
    justifyContent: "center"
  },
  topBarTextWrap: {
    gap: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#70605A"
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A08E88",
    marginTop: 2
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E57A58"
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 24
  },

  // Redesigned ID Card
  identityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F5ECE9",
    padding: 20,
    elevation: 3,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    gap: 16
  },
  identityCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  badgeStethoscopeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#96482e", // Deep terracotta
    alignItems: "center",
    justifyContent: "center"
  },
  activeStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF5EB",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6
  },
  activeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4A6047"
  },
  activeStatusText: {
    fontSize: 12,
    color: "#4A6047",
    fontWeight: "bold"
  },
  identityCardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  clinicianAvatarWrap: {
    position: "relative"
  },
  clinicianAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF0ED",
    borderWidth: 2,
    borderColor: "#FCEBE5",
    alignItems: "center",
    justifyContent: "center"
  },
  clinicianAvatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#96482e"
  },
  identityVerifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#96482e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF"
  },
  clinicianDetails: {
    flex: 1,
    gap: 3
  },
  clinicianNameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  clinicianRoleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#70605A"
  },
  clinicianIdText: {
    fontSize: 11,
    color: "#A08E88",
    fontWeight: "600"
  },
  identityCardDivider: {
    height: 1,
    backgroundColor: "#F5ECE9"
  },
  identityCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  footerDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  footerDetailText: {
    fontSize: 12,
    color: "#70605A",
    fontWeight: "600"
  },
  statCardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%"
  },

  // Performance Section
  statsSection: {
    gap: 12
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#70605A"
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderLeftWidth: 4,
    padding: 16,
    flex: 1,
    elevation: 2,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    gap: 4
  },
  statCardTerracotta: {
    borderLeftColor: "#E57A58"
  },
  statCardGreen: {
    borderLeftColor: "#4A6047"
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold"
  },
  textTerracotta: {
    color: "#E57A58"
  },
  textGreen: {
    color: "#4A6047"
  },
  statLabel: {
    fontSize: 12,
    color: "#70605A",
    fontWeight: "bold"
  },
  reviewsSection: {
    gap: 12
  },
  ratingSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4
  },
  ratingValue: {
    color: "#96482e",
    fontSize: 24,
    fontWeight: "bold"
  },
  ratingLabel: {
    color: "#70605A",
    fontSize: 12,
    fontWeight: "700"
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    padding: 14
  },
  reviewCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  reviewAuthor: {
    color: "#4A3E39",
    fontSize: 14,
    fontWeight: "bold"
  },
  reviewStars: {
    color: "#E57A58",
    fontSize: 13,
    fontWeight: "bold"
  },
  reviewText: {
    color: "#70605A",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18
  },
  reviewDate: {
    color: "#A08E88",
    fontSize: 11,
    fontWeight: "600"
  },
  noReviewsText: {
    color: "#A08E88",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },

  // Actions card panel
  actionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#F5ECE9",
    elevation: 1,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14
  },
  actionRowLast: {
    borderBottomWidth: 0
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF9F6",
    alignItems: "center",
    justifyContent: "center"
  },
  actionIconWrapRed: {
    backgroundColor: "#FCEBE5"
  },
  actionText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#70605A"
  },
  actionSubText: {
    color: "#A08E88",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  textRed: {
    color: "#B3261E"
  },
  divider: {
    height: 1,
    backgroundColor: "#F5ECE9"
  },
  locationSection: {
    gap: 12
  },
  locationCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 3,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    gap: 14
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#70605A",
    fontFamily: "Hind Siliguri"
  },
  locationInput: {
    backgroundColor: "#FFF9F6",
    borderColor: "#F5ECE9",
    borderRadius: 12,
    borderWidth: 1,
    color: "#4A3E39",
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 16,
    fontFamily: "Hind Siliguri"
  },
  gpsDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF9F6",
    borderColor: "#F5ECE9",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12
  },
  gpsValueText: {
    fontSize: 13,
    color: "#4A3E39",
    fontWeight: "600",
    marginTop: 4,
    fontFamily: "Hind Siliguri"
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#70605A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6
  },
  gpsBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Hind Siliguri"
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E57A58",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Hind Siliguri"
  },
  btnPressed: {
    opacity: 0.8
  },
  btnDisabled: {
    opacity: 0.6
  }
});
