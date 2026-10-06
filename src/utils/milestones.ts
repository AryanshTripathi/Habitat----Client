const YEAR = 365;

/** 1 day, 1 week, 21 days, 1 month, 2 months, 3 months, 6 months, 1 year. After that, one more year each time. */
export const MILESTONE_LADDER = [1, 7, 21, 30, 60, 90, 180, YEAR];

const LABELS: Record<number, string> = {
  1: '1 day',
  7: '1 week',
  21: '21 days',
  30: '1 month',
  60: '2 months',
  90: '3 months',
  180: '6 months',
  [YEAR]: '1 year',
};

export const milestoneLabel = (days: number) =>
  LABELS[days] ?? (days % YEAR === 0 ? `${days / YEAR} years` : `${days} days`);

/** The smallest milestone strictly above the given streak. */
export const nextMilestone = (streak: number): number => {
  const fromLadder = MILESTONE_LADDER.find((m) => m > streak);
  if (fromLadder !== undefined) return fromLadder;
  return (Math.floor(streak / YEAR) + 1) * YEAR;
};

/** Bar fill (0-1): progress from zero toward the next milestone. */
export const milestoneProgress = (streak: number) => Math.min(1, streak / nextMilestone(streak));
