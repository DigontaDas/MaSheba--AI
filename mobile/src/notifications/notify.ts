import * as Notifications from 'expo-notifications';

// Immediate notification (chat message, alert)
export async function notifyNow(
  title: string,
  body: string,
  channelId = 'maasheba-default',
  data: Record<string, unknown> = {}
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { 
        title, 
        body, 
        data, 
        sound: 'default' 
      },
      trigger: channelId ? { channelId } : null,
    });
  } catch (error) {
    // console.warn("Failed to trigger immediate notification:", error);
  }
}

// Scheduled reminder (water, nutrition, visit)
export async function scheduleReminder(
  title: string,
  body: string,
  hour: number,
  minute: number,
  repeats = true,
  channelId = 'maasheba-reminders'
) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const alreadyExists = scheduled.some((n) => {
      if (n.content.title !== title || n.content.body !== body) {
        return false;
      }
      const trig = n.trigger as any;
      if (!trig) return false;

      // Check daily trigger
      if (trig.type === 'daily' || trig.hour !== undefined) {
        return trig.hour === hour && trig.minute === minute;
      }

      // Check calendar trigger
      if (trig.type === 'calendar' && trig.dateComponents) {
        return trig.dateComponents.hour === hour && trig.dateComponents.minute === minute;
      }

      // Fallback if we cannot parse trigger components
      return true;
    });

    if (alreadyExists) {
      return null;
    }
  } catch (error) {
    // console.warn("Failed to check scheduled notifications:", error);
  }

  try {
    const triggerInput: any = repeats
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: false,
          channelId,
        };

    return await Notifications.scheduleNotificationAsync({
      content: { 
        title, 
        body, 
        sound: 'default' 
      },
      trigger: triggerInput,
    });
  } catch (error) {
    // console.warn("Failed to schedule daily reminder:", error);
    return null;
  }
}

// Cancel a specific notification by its returned ID
export async function cancelNotification(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (error) {
    // console.warn("Failed to cancel scheduled notification:", error);
  }
}

