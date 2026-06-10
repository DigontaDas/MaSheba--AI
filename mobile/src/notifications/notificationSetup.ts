import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getUserRole } from "@/auth/roleSession";
import { supabase } from "@/auth/supabaseAuth";

export async function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("maasheba-default", {
      name: "MaaSheba Notifications",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#96482e",
      enableLights: true,
      enableVibrate: true,
      showBadge: true
    });

    await Notifications.setNotificationChannelAsync("maasheba-reminders", {
      name: "Health reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      showBadge: false
    });

    await Notifications.setNotificationChannelAsync("maasheba-emergency", {
      name: "Emergency alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: "#ba1a1a",
      enableLights: true,
      enableVibrate: true,
      showBadge: true
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return false;
  }

  await registerCurrentDeviceForPush().catch(() => undefined);
  return true;
}

async function registerCurrentDeviceForPush() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
  if (!projectId) return;

  const [{ data: userResult }, role] = await Promise.all([supabase.auth.getUser(), getUserRole()]);
  const user = userResult.user;
  if (!user || !role) return;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";
  await supabase.from("notification_devices").upsert(
    {
      auth_user_id: user.id,
      role: role === "CHW" ? "chw" : "mother",
      expo_push_token: token.data,
      platform,
      enabled: true,
      last_seen_at: new Date().toISOString()
    },
    { onConflict: "auth_user_id,expo_push_token" }
  );
}
