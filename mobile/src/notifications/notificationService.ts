import Constants from "expo-constants";
import type { ChatCategory, ChatMessage } from "@/api/chatService";

// expo-notifications DevicePushTokenAutoRegistration triggers a crash in Expo Go SDK 53+.
// We conditionally require it only when we are NOT in the Expo Go client environment.
const isExpoGo = Constants.appOwnership === "expo";

let Notifications: any = null;
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
  } catch (error) {
    // console.warn("Failed to dynamically load expo-notifications:", error)
  }
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    }
  });
}

export async function registerForPushNotifications(): Promise<boolean> {
  if (!Notifications) {
    // console.log("Push notifications not supported in Expo Go")
    return false;
  }
  try {
    const current = await Notifications.getPermissionsAsync() as { status?: string; granted?: boolean };
    if (current.granted) return true;
    if (current.status === "granted") return true;
    const requested = await Notifications.requestPermissionsAsync() as { status?: string; granted?: boolean };
    if (requested.granted) return true;
    return requested.status === "granted";
  } catch (error) {
    // console.error("Error checking/requesting push notification permissions:", error)
    return false;
  }
}

export async function scheduleLocalNotification(params: {
  title: string;
  body: string;
  category?: ChatCategory | null;
  data?: Record<string, unknown>;
}): Promise<void> {
  if (!Notifications) {
    // console.log("Simulating local notification in Expo Go:", params.title, params.body)
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: { category: params.category, ...params.data },
        sound: "default",
        color: params.category === "জরুরি" ? "#B3261E" : "#E57A58"
      },
      trigger: null
    });
  } catch (error) {
    // console.error("Error scheduling local notification:", error)
  }
}

export function notificationTitleForMessage(message: ChatMessage): string {
  if (message.category === "জরুরি") return "জরুরি বার্তা";
  if (message.category) return `${message.category} বার্তা`;
  return "নতুন বার্তা";
}

