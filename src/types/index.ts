/** Server heatmap values (DONE/MISSED/EMPTY), lower-cased for the UI. */
export type DayStatus = 'done' | 'missed' | 'empty';

export type HabitFrequency = 'Daily' | 'Weekly';

/** Mirrors the server's Color enum. */
export type HabitColor =
  | 'GREEN'
  | 'BLUE'
  | 'PURPLE'
  | 'SKY_BLUE'
  | 'AMBER'
  | 'ORANGE'
  | 'RED'
  | 'PINK';

export type ThemeVariant = 'slate' | 'navy' | 'obsidian';

/** One scheduled day for a habit. `startTime` doubles as the reminder time. */
export interface ScheduleRow {
  day: number; // 0 = Mon ... 6 = Sun
  startTime: string; // 'HH:mm'
  endTime: string | null; // 'HH:mm'
}

export interface Habit {
  id: number;
  title: string;
  description: string;
  notes: string;
  icon: string;
  color: HabitColor;
  unitLabel: string;
  tags: string[];
  frequency: HabitFrequency;
  schedule: ScheduleRow[];
  /** One switch for all days; the schedule itself is kept when off. */
  reminderEnabled: boolean;
  isActive: boolean;
  currentStreak: number;
  maxStreak: number;
  totalDaysCompleted: number;
  completedToday: boolean;
  weekStatus: boolean[]; // Mon-Sun of the current week
  /** 5 weeks x 7 days, last row = current week. Null until the habit's detail has been loaded. */
  heatmap: DayStatus[][] | null;
}

export interface UserProfile {
  name: string;
  dailyTarget: number;
  morningReminder: string;
  eveningCheckIn: string;
  notificationsEnabled: boolean;
  soundEffects: boolean;
  weeklyReport: boolean;
  themeVariant: ThemeVariant;
}
