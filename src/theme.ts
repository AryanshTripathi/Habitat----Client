import { ThemeVariant } from './types';
import { useHabits } from './context/HabitContext';

export const THEME_BG: Record<ThemeVariant, string> = {
  slate: '#0D1117',
  navy: '#0B1324',
  obsidian: '#06080C',
};

/** Background color for the user's chosen theme variant. */
export const useThemeBg = () => THEME_BG[useHabits().profile.themeVariant];
