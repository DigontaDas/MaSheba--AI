import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { supabase } from "@/auth/supabaseAuth";
import { getSession } from "@/auth/secureSession";
import { upsertPatients } from "@/db/patients";
import { Icon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { colors, radius, spacing, typography } from "@/theme";
import type { Patient, RiskLevel } from "@/types/schema";

type ConnectionRequestRow = {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  mother_location: any;
  mother: {
    id: string;
    name: string;
    patient_id: string | null;
  } | null;
};

// Haversine formula to compute distance in km
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default function ChwRequestsScreen() {
  const { language: lang } = useLanguage();
  const [requests, setRequests] = useState<ConnectionRequestRow[]>([]);
  const [chwCoords, setChwCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (!session) {
        throw new Error(lang === "bn" ? "সেশন খুঁজে পাওয়া যায়নি।" : "Session not found.");
      }

      // Try capturing CHW current location
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
          setChwCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          });
        }
      } catch (locErr) {
        console.warn("Failed to capture CHW location for request distance comparison:", locErr);
      }

      // Fetch assigned requests from Supabase
      const { data, error } = await supabase
        .from("connection_requests")
        .select(`
          id,
          status,
          notes,
          created_at,
          mother_location,
          mother:mothers!mother_id(id, name, patient_id)
        `)
        .eq("chw_id", session.chwId)
        .eq("status", "assigned")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data || []) as any);
    } catch (err: any) {
      console.error("Failed to load assigned requests:", err);
      Alert.alert(
        lang === "bn" ? "লোড করতে ব্যর্থ হয়েছে" : "Load Failed",
        err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useFocusEffect(
    useCallback(() => {
      loadData().catch(() => undefined);
    }, [loadData])
  );

  const handleAccept = async (req: ConnectionRequestRow) => {
    if (!req.mother?.patient_id) {
      Alert.alert(
        lang === "bn" ? "ভুল রেকর্ড" : "Invalid Record",
        lang === "bn" ? "রোগীর রেকর্ড খুঁজে পাওয়া যায়নি।" : "Linked patient record not found."
      );
      return;
    }

    setActionLoadingId(req.id);
    try {
      // 1. Update request status to 'active' online
      const { error: updateErr } = await supabase
        .from("connection_requests")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", req.id);

      if (updateErr) throw updateErr;

      // 2. Fetch patient profile details online
      const { data: patient, error: patientErr } = await supabase
        .from("patients")
        .select("id,chw_id,name,age,gestational_age_weeks,last_risk_level,created_at,updated_at")
        .eq("id", req.mother.patient_id)
        .single();

      if (patientErr) throw patientErr;

      // 3. Upsert patient profile to local SQLite
      if (patient) {
        await upsertPatients([{
          id: patient.id,
          chw_id: patient.chw_id,
          name: patient.name,
          age: patient.age,
          gestational_age_weeks: patient.gestational_age_weeks,
          last_risk_level: patient.last_risk_level as RiskLevel,
          created_at: patient.created_at,
          updated_at: patient.updated_at
        }]);
      }

      Alert.alert(
        lang === "bn" ? "পরিদর্শন গৃহীত হয়েছে" : "Visit Accepted",
        lang === "bn"
          ? "সফলভাবে রোগীকে অফলাইনে সংরক্ষণ করা হয়েছে।"
          : "Visit has been accepted and synced offline.",
        [
          {
            text: lang === "bn" ? "ঠিক আছে" : "OK",
            onPress: () => router.push(`/assessment/${req.mother?.patient_id}`)
          }
        ]
      );
    } catch (err: any) {
      console.error("Failed to accept request:", err);
      Alert.alert(
        lang === "bn" ? "গ্রহণ করতে ব্যর্থ হয়েছে" : "Accept Failed",
        err.message || "Something went wrong"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (reqId: string) => {
    Alert.alert(
      lang === "bn" ? "বাতিল করতে চান?" : "Decline Request?",
      lang === "bn" 
        ? "আপনি কি এই অনুরোধটি প্রত্যাখ্যান করতে চান?" 
        : "Are you sure you want to decline this connection request?",
      [
        { text: lang === "bn" ? "না" : "No", style: "cancel" },
        {
          text: lang === "bn" ? "হ্যাঁ" : "Yes",
          onPress: async () => {
            setActionLoadingId(reqId);
            try {
              // Update request status to 'cancelled'
              const { error } = await supabase
                .from("connection_requests")
                .update({ status: "cancelled", updated_at: new Date().toISOString() })
                .eq("id", reqId);

              if (error) throw error;
              await loadData();
            } catch (err: any) {
              console.error("Failed to decline request:", err);
              Alert.alert(
                lang === "bn" ? "ব্যর্থ হয়েছে" : "Failed",
                err.message || "Something went wrong"
              );
            } finally {
              setActionLoadingId(null);
            }
          }
        }
      ]
    );
  };

  const renderDistance = (req: ConnectionRequestRow) => {
    let motherLat: number | null = null;
    let motherLng: number | null = null;
    const loc = req.mother_location;

    if (loc && typeof loc === "object" && loc.type === "Point" && Array.isArray(loc.coordinates)) {
      motherLng = loc.coordinates[0];
      motherLat = loc.coordinates[1];
    } else if (typeof loc === "string") {
      try {
        const clean = loc.replace("POINT(", "").replace(")", "").trim();
        const parts = clean.split(" ");
        if (parts.length >= 2) {
          motherLng = parseFloat(parts[0]);
          motherLat = parseFloat(parts[1]);
        }
      } catch (err) {}
    }

    if (chwCoords && motherLat !== null && motherLng !== null) {
      const distance = getDistanceKm(
        chwCoords.latitude,
        chwCoords.longitude,
        motherLat,
        motherLng
      );
      const distStr = distance.toFixed(1);
      return lang === "bn" 
        ? `📍 ${distStr} কি.মি. দূরে` 
        : `📍 ${distStr} km away`;
    }

    return lang === "bn" ? "📍 দূরত্ব অজানা" : "📍 Distance unknown";
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>
          {lang === "bn" ? "অনুরোধ লোড হচ্ছে..." : "Loading requests..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {lang === "bn" ? "নিযুক্ত অনুরোধসমূহ" : "Assigned Requests"}
        </Text>
        <Text style={styles.subtitle}>
          {lang === "bn"
            ? "আপনাকে অর্পিত নতুন পরিদর্শন অনুরোধসমূহ পর্যালোচনা করুন"
            : "Review new connection requests assigned to you"}
        </Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="assignment-turned-in" size={48} color={colors.outline} />
            <Text style={styles.emptyTitle}>
              {lang === "bn" ? "কোনো নিযুক্ত অনুরোধ নেই" : "No Assigned Requests"}
            </Text>
            <Text style={styles.emptyText}>
              {lang === "bn" 
                ? "এই মুহূর্তে কোনো নতুন অনুরোধ আপনার কাছে অর্পণ করা হয়নি।" 
                : "No new connection requests have been assigned to you at the moment."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isButtonLoading = actionLoadingId === item.id;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.motherInfo}>
                  <Icon name="person" size={20} color={colors.primary} />
                  <Text style={styles.motherName}>
                    {item.mother?.name || (lang === "bn" ? "অজানা মা" : "Unknown Mother")}
                  </Text>
                </View>
                <Text style={styles.distanceText}>{renderDistance(item)}</Text>
              </View>

              {item.notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>
                    {lang === "bn" ? "বিশেষ দ্রষ্টব্য:" : "Notes:"}
                  </Text>
                  <Text style={styles.notesText}>"{item.notes}"</Text>
                </View>
              )}

              <View style={styles.btnRow}>
                <Pressable
                  onPress={() => handleDecline(item.id)}
                  disabled={isButtonLoading}
                  style={[styles.declineBtn, isButtonLoading && styles.btnDisabled]}
                >
                  <Text style={styles.declineBtnText}>
                    {lang === "bn" ? "প্রত্যাখ্যান" : "Decline"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleAccept(item)}
                  disabled={isButtonLoading}
                  style={[styles.acceptBtn, isButtonLoading && styles.btnDisabled]}
                >
                  {isButtonLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.acceptBtnText}>
                      {lang === "bn" ? "পরিদর্শন গ্রহণ" : "Accept Visit"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 48
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  loadingText: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  header: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.xs
  },
  title: {
    ...typography.h1,
    color: colors.primary
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  listContainer: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
    gap: spacing.base
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: spacing.sm,
    textAlign: "center"
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.onSurface,
    marginTop: spacing.xs
  },
  emptyText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: spacing.lg
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.base,
    gap: spacing.sm,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  motherInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1
  },
  motherName: {
    ...typography.h2,
    color: colors.onSurface,
    fontSize: 16
  },
  distanceText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "bold"
  },
  notesBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.default,
    gap: 2
  },
  notesLabel: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    fontWeight: "bold"
  },
  notesText: {
    ...typography.body,
    color: colors.onSurface,
    fontSize: 13,
    fontStyle: "italic"
  },
  btnRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  declineBtn: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.default,
    alignItems: "center",
    justifyContent: "center"
  },
  declineBtnText: {
    ...typography.body,
    color: colors.error,
    fontWeight: "bold"
  },
  acceptBtn: {
    flex: 1.5,
    minHeight: 40,
    backgroundColor: colors.primary,
    borderRadius: radius.default,
    alignItems: "center",
    justifyContent: "center"
  },
  acceptBtnText: {
    ...typography.body,
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  btnDisabled: {
    opacity: 0.5
  }
});
