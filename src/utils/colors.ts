import { Habit, HabitColor } from '../types';

export const COLOR_HEX: Record<HabitColor, string> = {
  GREEN: '#10B981',
  BLUE: '#3B82F6',
  PURPLE: '#A855F7',
  SKY_BLUE: '#38BDF8',
  AMBER: '#F59E0B',
  ORANGE: '#F97316',
  RED: '#EF4444',
  PINK: '#EC4899',
};

export const COLOR_KEYS = Object.keys(COLOR_HEX) as HabitColor[];

export const DEFAULT_COLOR: HabitColor = 'BLUE';

export const hexToRgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

export const accentOf = (h: Pick<Habit, 'color'>) => COLOR_HEX[h.color];
export const iconBgOf = (h: Pick<Habit, 'color'>) => hexToRgba(COLOR_HEX[h.color], 0.18);
