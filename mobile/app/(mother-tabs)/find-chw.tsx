import { useCallback, useEffect, useState } from "react";
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import MapView, { Marker, Circle, UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import { getCurrentMotherProfile } from "@/auth/roleSession";
import { supabase } from "@/auth/supabaseAuth";
import { Icon } from "@/components/ui/Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { useLanguage } from "@/context/LanguageContext";
import { toBanglaNumber } from "@/utils/banglaNumerals";

type ViewMode = "list" | "map";

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

export default function FindChwScreen() {
  const { language: lang } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [motherId, setMotherId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyChws, setNearbyChws] = useState<CHW[]>([]);
  const [pendingRequest, setPendingRequest] = useState<ConnectionRequest | null>(null);

  const fetchRequestStatus = async (mId: string) => {
    try {
      const { data, error } = await supabase
        .from("connection_requests")
        .select(`
          id,
          status,
          chw_id
        `)
        .eq("mother_id", mId)
        .in("status", ["pending", "assigned"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        let reqData: ConnectionRequest = {
          id: data.id,
          status: data.status as any,
          chw_id: data.chw_id
        };

        if (data.chw_id) {
          const { data: chw } = await supabase
            .from("chws")
            .select("name")
            .eq("id", data.chw_id)
            .maybeSingle();
          if (chw) {
            reqData.chws = { name: chw.name };
          }
        }
        setPendingRequest(reqData);
      } else {
        setPendingRequest(null);
      }
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
      setMotherId(profile.id);
      await fetchRequestStatus(profile.id);

      // Get current position
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoading(false);
        Alert.alert(
          lang === "bn" ? "অনুমতি প্রয়োজন" : "Permission Required",
          lang === "bn"
            ? "স্বাস্থ্যকর্মীদের দূরত্ব দেখার জন্য লোকেশন পারমিশন প্রয়োজন।"
            : "Location permissions are required to find nearby health workers."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const currentCoords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      };
      setCoords(currentCoords);

      // Query database RPC
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
      const { error } = await supabase
        .from("connection_requests")
        .insert({
          mother_id: motherId,
          mother_location: pointWkt,
          status: "pending"
        });

      if (error) throw error;

      Alert.alert(
        lang === "bn" ? "অনুরোধ পাঠানো হয়েছে" : "Request Submitted",
        lang === "bn"
          ? "অ্যাডমিন শীঘ্রই একজন স্বাস্থ্যকর্মী নিয়োগ করবেন।"
          : "An administrator will assign a health worker to you shortly."
      );
      await fetchRequestStatus(motherId);
    } catch (err: any) {
      Alert.alert(lang === "bn" ? "ব্যর্থ হয়েছে" : "Submission Failed", err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChat = (chwId: string) => {
    // Navigate to chat and trigger state updates if needed
    router.push("/(mother-tabs)/chat");
  };

  const formatDistance = (dist: number) => {
    const kmStr = dist.toFixed(2);
    return lang === "bn" ? `${toBanglaNumber(kmStr)} কি.মি.` : `${kmStr} km`;
  };

  const stadiaApiKey = process.env.EXPO_PUBLIC_STADIA_MAPS_API_KEY;
  const tileUrl = `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${stadiaApiKey}`;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {lang === "bn" ? "নিকটস্থ স্বাস্থ্যকর্মী" : "Nearby Health Workers"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {lang === "bn"
            ? "আপনার চারপাশের স্বাস্থ্যকর্মীদের খুঁজুন এবং যোগাযোগ করুন"
            : "Locate and connect with active CHWs in your area"}
        </Text>
      </View>

      <View style={styles.segmentedContainer}>
        <Pressable
          style={[styles.segmentButton, viewMode === "list" && styles.segmentActive]}
          onPress={() => setViewMode("list")}
        >
          <Icon name="list" color={viewMode === "list" ? "#FFFFFF" : "#70605A"} size={20} />
          <Text style={[styles.segmentText, viewMode === "list" && styles.segmentTextActive]}>
            {lang === "bn" ? "তালিকা" : "List View"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentButton, viewMode === "map" && styles.segmentActive]}
          onPress={() => setViewMode("map")}
        >
          <Icon name="map" color={viewMode === "map" ? "#FFFFFF" : "#70605A"} size={20} />
          <Text style={[styles.segmentText, viewMode === "map" && styles.segmentTextActive]}>
            {lang === "bn" ? "মানচিত্র" : "Map View"}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#E57A58" />
          <Text style={styles.loadingText}>
            {lang === "bn" ? "স্বাস্থ্যকর্মী খোঁজা হচ্ছে..." : "Searching for health workers..."}
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
          {pendingRequest && (
            <View style={[styles.alertBanner, pendingRequest.status === "assigned" && styles.alertBannerAssigned]}>
              <Icon
                name={pendingRequest.status === "assigned" ? "check-circle" : "hourglass-empty"}
                color={pendingRequest.status === "assigned" ? "#4A6047" : "#E57A58"}
                size={22}
              />
              <View style={styles.alertTextWrap}>
                <Text style={styles.alertTitle}>
                  {pendingRequest.status === "assigned"
                    ? (lang === "bn" ? "স্বাস্থ্যকর্মী নিযুক্ত করা হয়েছে" : "Health Worker Assigned")
                    : (lang === "bn" ? "অনুরোধ প্রক্রিয়াধীন রয়েছে" : "Connection Request Pending")}
                </Text>
                <Text style={styles.alertDesc}>
                  {pendingRequest.status === "assigned"
                    ? (lang === "bn"
                        ? `${pendingRequest.chws?.name} আপনার অনুরোধ গ্রহণ করেছেন।`
                        : `${pendingRequest.chws?.name} has been assigned to help you.`)
                    : (lang === "bn"
                        ? "অনুগ্রহ করে অ্যাডমিন অনুমোদন হওয়া পর্যন্ত অপেক্ষা করুন।"
                        : "Waiting for admin assignment of a health worker.")}
                </Text>
              </View>
              {pendingRequest.status === "assigned" && pendingRequest.chw_id && (
                <Pressable
                  style={styles.alertChatBtn}
                  onPress={() => handleOpenChat(pendingRequest.chw_id!)}
                >
                  <Icon name="chat" color="#FFFFFF" size={18} />
                </Pressable>
              )}
            </View>
          )}

          {viewMode === "list" ? (
            <ScrollView contentContainerStyle={styles.listContent}>
              {nearbyChws.length > 0 ? (
                nearbyChws.map((chw) => (
                  <View key={chw.chw_id} style={styles.chwCard}>
                    <View style={styles.chwInfo}>
                      <View style={styles.avatar}>
                        <Icon name="person" color="#FFFFFF" size={24} />
                      </View>
                      <View style={styles.chwDetails}>
                        <Text style={styles.chwName}>{chw.name}</Text>
                        <Text style={styles.chwArea}>
                          {chw.union_name}, {chw.upazila}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.chwActions}>
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceText}>{formatDistance(chw.distance_km)}</Text>
                      </View>
                      <Pressable style={styles.chatButton} onPress={() => handleOpenChat(chw.chw_id)}>
                        <Icon name="chat" color="#FFFFFF" size={16} />
                        <Text style={styles.chatButtonText}>{lang === "bn" ? "চ্যাট" : "Chat"}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Icon name="location-off" color="#A08E88" size={48} />
                  <Text style={styles.emptyText}>
                    {lang === "bn"
                      ? "১০ কি.মি.-এর মধ্যে কোনো স্বাস্থ্যকর্মী পাওয়া যায়নি।"
                      : "No active health workers found within 10 km."}
                  </Text>
                  {!pendingRequest && (
                    <Pressable
                      style={styles.requestButton}
                      disabled={submitting}
                      onPress={handleRequestChw}
                    >
                      <Text style={styles.requestButtonText}>
                        {submitting
                          ? (lang === "bn" ? "অনুরোধ পাঠানো হচ্ছে..." : "Submitting...")
                          : (lang === "bn" ? "স্বাস্থ্যকর্মীর জন্য অনুরোধ করুন" : "Request a Health Worker")}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.mapContainer}>
              {coords ? (
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  initialRegion={{
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.15,
                    longitudeDelta: 0.15
                  }}
                >
                  {/* Stadia Maps Tiles overlay */}
                  <UrlTile urlTemplate={tileUrl} maximumZ={19} tileSize={256} />

                  {/* Mother self marker */}
                  <Marker
                    coordinate={coords}
                    title={lang === "bn" ? "আপনার অবস্থান" : "Your Location"}
                    pinColor={colors.primary}
                  />

                  {/* 10km radius circle */}
                  <Circle
                    center={coords}
                    radius={10000}
                    strokeWidth={1.5}
                    strokeColor="#E57A58"
                    fillColor="rgba(229, 122, 88, 0.08)"
                  />

                  {/* CHW pins */}
                  {nearbyChws.map((chw) => (
                    <Marker
                      key={chw.chw_id}
                      coordinate={{ latitude: chw.latitude, longitude: chw.longitude }}
                      title={chw.name}
                      description={`${chw.union_name} (${formatDistance(chw.distance_km)})`}
                      pinColor="#2196F3"
                      onCalloutPress={() => handleOpenChat(chw.chw_id)}
                    />
                  ))}
                </MapView>
              ) : (
                <View style={styles.mapError}>
                  <Text style={styles.errorText}>
                    {lang === "bn" ? "মানচিত্র লোড করা যায়নি।" : "Unable to render map view."}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomColor: "#F5ECE9",
    borderBottomWidth: 1
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
  segmentedContainer: {
    backgroundColor: "#FCEBE5",
    borderRadius: 24,
    flexDirection: "row",
    gap: 4,
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 4
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 40
  },
  segmentActive: {
    backgroundColor: "#E57A58"
  },
  segmentText: {
    color: "#70605A",
    fontSize: 14,
    fontWeight: "bold"
  },
  segmentTextActive: {
    color: "#FFFFFF"
  },
  container: {
    flex: 1
  },
  loadingWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    gap: 12
  },
  loadingText: {
    ...typography.body,
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
    marginHorizontal: 20,
    marginBottom: 12,
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
    fontWeight: "bold",
    color: colors.onSurface
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
  listContent: {
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 24
  },
  chwCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F2EBE8",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.base,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  chwInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    flex: 1
  },
  avatar: {
    backgroundColor: "#E57A58",
    borderRadius: 20,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  chwDetails: {
    flex: 1,
    gap: 2
  },
  chwName: {
    ...typography.body,
    fontWeight: "bold",
    color: colors.onSurface
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
    minHeight: 32,
    paddingHorizontal: 12,
    justifyContent: "center"
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold"
  },
  mapContainer: {
    flex: 1,
    overflow: "hidden"
  },
  mapError: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  errorText: {
    ...typography.body,
    color: colors.error
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12
  },
  emptyText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: "center"
  },
  requestButton: {
    backgroundColor: "#E57A58",
    borderRadius: 24,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 12
  },
  requestButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold"
  }
});
