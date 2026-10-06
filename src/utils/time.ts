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

/** A habit lives within one day: the end must be strictly after the start (no crossing midnight). 'HH:mm' compares correctly as text. */
export const isEndAfterStart = (start: string, end: string) => end > start;

/** Initial value for an end-time picker: 30 minutes after the start, but never past 23:59. */
export const suggestEnd = (start: string) => {
  const { hour, minute } = parseHHmm(start);
  const total = Math.min(hour * 60 + minute + 30, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
