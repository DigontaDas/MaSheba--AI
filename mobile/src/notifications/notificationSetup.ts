import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function setupNotifications() {
  // Set handler — REQUIRED for foreground notifications to show
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Android channel — REQUIRED for Android 8+
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('maasheba-default', {
      name: 'MaaSheba Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#96482e',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('maasheba-reminders', {
      name: 'স্বাস্থ্য স্মরণিকা',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      sound: 'default',
      showBadge: false,
    });

    await Notifications.setNotificationChannelAsync('maasheba-emergency', {
      name: 'জরুরি সতর্কতা',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#ba1a1a',
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }

  // Request permissions
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;
  }
  return true;
}
