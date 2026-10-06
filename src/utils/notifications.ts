import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Habit, UserProfile } from '../types';
import { parseHHmm } from './time';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Parses profile times like '07:30 AM' into 24h hour/minute. */
const parseAmPm = (label: string): { hour: number; minute: number } | null => {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(label);
  if (!m) return null;
  let hour = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === 'PM') hour += 12;
  return { hour, minute: parseInt(m[2], 10) };
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
};

/** Our days are 0 = Mon ... 6 = Sun; expo-notifications wants 1 = Sun ... 7 = Sat. */
const toExpoWeekday = (day: number) => ((day + 1) % 7) + 1;

const dailyCheckIn = (title: string, body: string, label: string, sound: boolean) => {
  const t = parseAmPm(label);
  if (!t) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: t.hour, minute: t.minute },
  });
};

/**
 * Cancels everything and re-schedules from current state: one weekly alert per scheduled day of every habit with
 * reminders on (fired at that day's startTime), plus the profile's morning/evening check-ins.
 */
export const syncReminders = async (habits: Habit[], profile: UserProfile) => {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!profile.notificationsEnabled) return;
  if (!(await requestNotificationPermission())) return;

  const jobs: (Promise<string> | null)[] = [];
  for (const h of habits) {
    if (!h.reminderEnabled) continue;
    for (const row of h.schedule) {
      const { hour, minute } = parseHHmm(row.startTime);
      jobs.push(
        Notifications.scheduleNotificationAsync({
          content: { title: h.title, body: h.description || 'Time for your habit', sound: profile.soundEffects },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: toExpoWeekday(row.day),
            hour,
            minute,
          },
        })
      );
    }
  }
  jobs.push(dailyCheckIn('Morning check-in', 'Plan your habits for today', profile.morningReminder, profile.soundEffects));
  jobs.push(dailyCheckIn('Evening check-in', 'Log what you completed today', profile.eveningCheckIn, profile.soundEffects));
  await Promise.all(jobs.filter(Boolean));
};
