import { Habit, ScheduleRow } from '../types';
import { todayWeekdayIndex } from './dates';
import { dayShort, formatTime } from './time';

export const todayRow = (h: Habit): ScheduleRow | undefined =>
  h.schedule.find((r) => r.day === todayWeekdayIndex());

export const isScheduledToday = (h: Habit) => !!todayRow(h);

/** The featured habit on Today: highest current streak (ties go to the higher max streak). */
export const pickFeatured = (habits: Habit[]): Habit | undefined =>
  [...habits].sort((a, b) => b.currentStreak - a.currentStreak || b.maxStreak - a.maxStreak)[0];

/** 'Daily · 6:30 AM' or 'Mon, Wed · 6:00 PM' (or 'varies' when the days have different times). */
export const scheduleSummary = (h: Habit) => {
  if (h.schedule.length === 0) return h.frequency;
  const days =
    h.schedule.length === 7
      ? 'Daily'
      : [...h.schedule].sort((a, b) => a.day - b.day).map((r) => dayShort(r.day)).join(', ');
  const times = new Set(h.schedule.map((r) => r.startTime));
  const time = times.size === 1 ? formatTime(h.schedule[0].startTime) : 'times vary';
  return `${days} · ${time}`;
};

/** Which of the four bundled banners a habit uses: stable per habit, but spread across habits. */
export const bannerIndexFor = (id: number) => Math.abs(id) % 4;
