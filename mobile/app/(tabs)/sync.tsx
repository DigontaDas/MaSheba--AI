import { StyleSheet, View } from "react-native";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SyncStatus } from "@/components/SyncStatus";

export default function SyncScreen() {
  return (
    <View style={styles.screen}>
      <OfflineBanner />
      <SyncStatus />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1
  }
});
