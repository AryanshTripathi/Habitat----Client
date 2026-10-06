import { DayStatus, Habit, ScheduleRow } from '../types';
import { HabitDraft } from '../context/HabitContext';
import { DEFAULT_COLOR } from '../utils/colors';
import {
  DayOfWeekDto,
  HabitDetailDto,
  HabitDto,
  HabitRequestDto,
  ScheduleDto,
  ScheduleTodayRowDto,
} from './types';

const DAYS: DayOfWeekDto[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/** '21:00:00' -> '21:00' */
const hhmm = (t: string) => t.slice(0, 5);

const scheduleFromDto = (s: ScheduleDto): ScheduleRow => ({
  day: DAYS.indexOf(s.dayOfWeek),
  startTime: hhmm(s.startTime),
  endTime: s.endTime ? hhmm(s.endTime) : null,
});

const dayStatusFromDto = (s: 'DONE' | 'MISSED' | 'EMPTY'): DayStatus => s.toLowerCase() as DayStatus;

/** Server habit -> UI habit. The list endpoint has no heatmap, so it stays null until the detail is loaded. */
export const habitFromDto = (dto: HabitDto | HabitDetailDto, previousHeatmap: DayStatus[][] | null = null): Habit => ({
  id: dto.id,
  title: dto.name,
  description: dto.description ?? '',
  notes: dto.notes ?? '',
  icon: dto.icon ?? 'star-outline',
  color: dto.color ?? DEFAULT_COLOR,
  unitLabel: dto.unitLabel ?? 'Days completed',
  tags: dto.tags ?? [],
  frequency: dto.frequencyType === 'WEEKLY' ? 'Weekly' : 'Daily',
  schedule: (dto.habitSchedule ?? []).map(scheduleFromDto).sort((a, b) => a.day - b.day),
  reminderEnabled: dto.reminderEnabled,
  isActive: dto.isActive ?? dto.active ?? true,
  currentStreak: dto.currentStreak,
  maxStreak: dto.maxStreak,
  totalDaysCompleted: dto.totalDaysCompleted,
  completedToday: dto.completedToday,
  weekStatus: dto.weekStatus,
  heatmap: 'heatmap' in dto && dto.heatmap ? dto.heatmap.map((row) => row.map(dayStatusFromDto)) : previousHeatmap,
});

/** Edit-form data -> request body. */
export const requestFromDraft = (draft: HabitDraft, title: string, isActive = true): HabitRequestDto => ({
  name: title,
  description: draft.description,
  notes: draft.notes,
  icon: draft.icon,
  color: draft.color,
  unitLabel: draft.unitLabel,
  frequencyType: draft.frequency === 'Weekly' ? 'WEEKLY' : 'DAILY',
  reminderEnabled: draft.reminderEnabled,
  isActive,
  tags: draft.tags,
  habitSchedule: draft.schedule.map((r) => ({
    dayOfWeek: DAYS[r.day],
    startTime: r.startTime,
    endTime: r.endTime,
  })),
});

export interface ScheduleItem {
  habitId: number;
  title: string;
  icon: string;
  color: Habit['color'];
  description: string;
  startTime: string;
  endTime: string | null;
  completedToday: boolean;
}

export const scheduleItemFromDto = (dto: ScheduleTodayRowDto): ScheduleItem => ({
  habitId: dto.habitId,
  title: dto.name,
  icon: dto.icon ?? 'star-outline',
  color: dto.color ?? DEFAULT_COLOR,
  description: dto.description ?? '',
  startTime: hhmm(dto.startTime),
  endTime: dto.endTime ? hhmm(dto.endTime) : null,
  completedToday: dto.completedToday,
});
