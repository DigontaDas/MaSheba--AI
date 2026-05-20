import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { OfflineBanner } from "@/components/OfflineBanner";
import { RiskBadge } from "@/components/RiskBadge";
import { SyncStatus } from "@/components/SyncStatus";
import { getPatients } from "@/db/patients";
import type { Patient } from "@/types/schema";

export default function PatientListScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setPatients(await getPatients());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <OfflineBanner />
      <SyncStatus compact />
      <FlatList
        contentContainerStyle={styles.list}
        data={patients}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No local patients yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/assessment/${item.id}`)}>
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                Age {item.age} • {item.gestational_age_weeks} weeks
              </Text>
            </View>
            <RiskBadge level={item.last_risk_level} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1
  },
  list: {
    gap: 10,
    padding: 16
  },
  row: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 76,
    padding: 14
  },
  rowText: {
    flex: 1,
    gap: 4,
    paddingRight: 12
  },
  name: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700"
  },
  meta: {
    color: "#64748b",
    fontSize: 13
  },
  empty: {
    color: "#64748b",
    padding: 16,
    textAlign: "center"
  }
});
