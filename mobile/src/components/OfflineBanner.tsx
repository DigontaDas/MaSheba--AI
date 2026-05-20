import { StyleSheet, Text, View } from "react-native";
import { useNetworkState } from "expo-network";

export function OfflineBanner() {
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;

  if (!offline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Offline mode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#7f1d1d",
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700"
  }
});
