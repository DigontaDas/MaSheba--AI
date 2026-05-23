import { StyleSheet, Text, View } from "react-native";
import type { OfflineQa } from "@/types/schema";

export function EmergencyQaBanner({ item }: { item: OfflineQa }) {
  if (!item.emergency && !item.see_doctor) {
    return null;
  }

  return (
    <View style={[styles.banner, item.emergency ? styles.emergency : styles.warning]}>
      <Text style={[styles.title, item.emergency ? styles.emergencyText : styles.warningText]}>
        {item.emergency ? "জরুরি: এখনই হাসপাতালে যান" : "সতর্কতা: স্বাস্থ্যকর্মীকে জানান"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  emergency: {
    backgroundColor: "#fff1f2",
    borderColor: "#be123c"
  },
  warning: {
    backgroundColor: "#fffbeb",
    borderColor: "#d97706"
  },
  title: {
    fontWeight: "800"
  },
  emergencyText: {
    color: "#be123c"
  },
  warningText: {
    color: "#92400e"
  }
});
