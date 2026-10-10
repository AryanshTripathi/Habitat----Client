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

/** Days as text: 'Every day', or runs of 3+ days collapsed, e.g. [0,1,3,4,5,6] -> 'Mon, Tue, Thu – Sun'. */
export const dayRunsLabel = (days: number[]) => {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 7) return 'Every day';
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    if (j - i >= 2) parts.push(`${dayShort(sorted[i])} – ${dayShort(sorted[j])}`);
    else for (let k = i; k <= j; k++) parts.push(dayShort(sorted[k]));
    i = j + 1;
  }
  return parts.join(', ');
};

export interface ScheduleGroup {
  days: number[];
  startTime: string;
  endTime: string;
  label: string;
}

/** The schedule grouped by identical start/end times, earliest day first. */
export const scheduleGroups = (h: Habit): ScheduleGroup[] => {
  const byTimes = new Map<string, ScheduleGroup>();
  for (const r of [...h.schedule].sort((a, b) => a.day - b.day)) {
    const key = `${r.startTime}-${r.endTime}`;
    const group = byTimes.get(key) ?? { days: [], startTime: r.startTime, endTime: r.endTime, label: '' };
    group.days.push(r.day);
    byTimes.set(key, group);
  }
  return [...byTimes.values()].map((g) => ({ ...g, label: dayRunsLabel(g.days) }));
};
