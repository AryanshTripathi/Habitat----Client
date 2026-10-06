const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Index of today in a Mon-first week: 0 = Mon ... 6 = Sun. */
export const todayWeekdayIndex = (now = new Date()) => (now.getDay() + 6) % 7;

/** The heatmap is a 5-week window whose last row is the current week. */
export const HEATMAP_WEEKS = 5;

/** Day-of-month of the Monday that starts each heatmap row. */
export const heatmapWeekStarts = (now = new Date()): string[] => {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - todayWeekdayIndex(now));
  return Array.from({ length: HEATMAP_WEEKS }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() - 7 * (HEATMAP_WEEKS - 1 - i));
    return String(d.getDate());
  });
};

export const greeting = (now = new Date()) => {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export const formatToday = (now = new Date()) =>
  `${SHORT_DAYS[now.getDay()]}, ${SHORT_MONTHS[now.getMonth()]} ${now.getDate()}`;

export const formatMonthYear = (now = new Date()) =>
  `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
