import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/auth/supabaseAuth";

const LAST_LOCATION_UPDATE_KEY = "maasheba_last_location_update";
const UPDATE_THROTTLE_MS = 30 * 60 * 1000; // 30 minutes throttle

/**
 * Requests location permission and updates the CHW's geography location in the database,
 * using AsyncStorage to throttle updates to once every 30 minutes to preserve battery.
 */
export async function updateChwLocation(chwId: string): Promise<void> {
  if (!chwId) return;

  try {
    const lastUpdateStr = await AsyncStorage.getItem(LAST_LOCATION_UPDATE_KEY);
    const now = Date.now();

    if (lastUpdateStr) {
      const lastUpdate = parseInt(lastUpdateStr, 10);
      if (now - lastUpdate < UPDATE_THROTTLE_MS) {
        console.log("CHW location update skipped (throttled).");
        return;
      }
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Location permission not granted for CHW update.");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const locationPoint = `POINT(${loc.coords.longitude} ${loc.coords.latitude})`;

    const { error } = await supabase
      .from("chws")
      .update({ location: locationPoint })
      .eq("id", chwId);

    if (error) {
      console.error("Failed to update CHW location in Supabase:", error.message);
    } else {
      await AsyncStorage.setItem(LAST_LOCATION_UPDATE_KEY, String(now));
      console.log("CHW location updated successfully:", locationPoint);
    }
  } catch (err) {
    console.error("Error updating CHW location:", err);
  }
}
