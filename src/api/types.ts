import { HabitColor } from '../types';

export type DayOfWeekDto =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface ScheduleDto {
  id?: number;
  dayOfWeek: DayOfWeekDto;
  startTime: string; // 'HH:mm' or 'HH:mm:ss'
  endTime: string | null;
}

/** HabitResponse from the server (GET /habits, complete/undo, create/update). */
export interface HabitDto {
  id: number;
  name: string;
  description: string | null;
  notes: string | null;
  icon: string | null;
  color: HabitColor | null;
  unitLabel: string | null;
  frequencyType: 'DAILY' | 'WEEKLY' | null;
  reminderEnabled: boolean;
  isActive?: boolean;
  active?: boolean; // in case the server serializes the record component as 'active'
  tags: string[] | null;
  habitSchedule: ScheduleDto[] | null;
  createdOn: string;
  currentStreak: number;
  maxStreak: number;
  xpPerCompletion: number;
  totalXpEarned: number;
  completedToday: boolean;
  scheduledToday: boolean;
  totalDaysCompleted: number;
  weekStatus: boolean[];
}

/** HabitDetailResponse (GET /habits/{id}) adds the heatmap. */
export interface HabitDetailDto extends HabitDto {
  heatmap: ('DONE' | 'MISSED' | 'EMPTY')[][];
}

/** HabitRequest body for create and update. */
export interface HabitRequestDto {
  name: string;
  description: string;
  notes: string;
  icon: string;
  color: HabitColor;
  unitLabel: string;
  frequencyType: 'DAILY' | 'WEEKLY';
  reminderEnabled: boolean;
  isActive: boolean;
  tags: string[];
  habitSchedule: ScheduleDto[];
}

/** GET /schedule/today row. */
export interface ScheduleTodayRowDto {
  habitId: number;
  name: string;
  icon: string | null;
  color: HabitColor | null;
  description: string | null;
  startTime: string;
  endTime: string | null;
  reminderEnabled: boolean;
  completedToday: boolean;
}
