const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const dayShort = (d: number) => DAY_SHORT[d];

/** 'HH:mm' (or 'HH:mm:ss') -> { hour, minute } */
export const parseHHmm = (value: string) => {
  const [h, m] = value.split(':');
  return { hour: parseInt(h, 10), minute: parseInt(m, 10) };
};

/** '21:00' -> '9:00 PM' */
export const formatTime = (value: string) => {
  const { hour, minute } = parseHHmm(value);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`;
};

export const timeRange = (start: string, end: string | null) =>
  end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);

export const toHHmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const hhmmToDate = (value: string) => {
  const { hour, minute } = parseHHmm(value);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
};

const END_OF_DAY = '00:00';
const toMinutes = (v: string) => {
  const { hour, minute } = parseHHmm(v);
  return hour * 60 + minute;
};
const fromMinutes = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
/** 00:00 as an END time means the end of the day (12:00 AM), i.e. minute 1440. */
const endMinutes = (end: string) => (end === END_OF_DAY ? 1440 : toMinutes(end));

/**
 * A habit lives within one day: the end must be after the start. The only way to reach midnight is an end of
 * 00:00 (12:00 AM), which counts as the end of the day; it can't be used with a start of 00:00.
 */
export const isEndAfterStart = (start: string, end: string) =>
  end === END_OF_DAY ? start !== END_OF_DAY : end > start;

/** One hour after the start; a start at 23:00 or later ends at 00:00 (12:00 AM). */
export const defaultEnd = (start: string) => (toMinutes(start) >= 23 * 60 ? END_OF_DAY : fromMinutes(toMinutes(start) + 60));

/** When the start moves, the end moves with it so the length of the habit stays the same (capped at 00:00). */
export const shiftEnd = (oldStart: string, oldEnd: string, newStart: string) => {
  const duration = endMinutes(oldEnd) - toMinutes(oldStart);
  if (duration <= 0) return defaultEnd(newStart);
  const total = toMinutes(newStart) + duration;
  return total >= 1440 ? END_OF_DAY : fromMinutes(total);
};
