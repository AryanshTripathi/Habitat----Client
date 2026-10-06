import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, UserProfile } from '../types';
import { INITIAL_PROFILE } from '../data/defaultProfile';
import { syncReminders } from '../utils/notifications';
import { api, ApiError } from '../api/client';
import { habitFromDto, requestFromDraft } from '../api/mappers';

// Only the profile/settings live on the device. Habits come from the server.
const PROFILE_KEY = 'habitat_profile_v1';

/** The fields a user edits in Create/Edit. Everything else comes from the server. */
export type HabitDraft = Pick<
  Habit,
  'title' | 'description' | 'notes' | 'icon' | 'color' | 'unitLabel' | 'tags' | 'frequency' | 'schedule' | 'reminderEnabled'
>;

type Status = 'loading' | 'ready' | 'error';

interface HabitContextType {
  habits: Habit[];
  profile: UserProfile;
  /** Profile loaded from the device. */
  ready: boolean;
  /** State of the habits fetch. */
  status: Status;
  error: string | null;
  reload: () => Promise<void>;
  loadHabitDetail: (habitId: number) => Promise<void>;
  toggleHabitToday: (habitId: number) => Promise<void>;
  createHabit: (draft: HabitDraft) => Promise<boolean>;
  updateHabit: (habitId: number, draft: HabitDraft) => Promise<boolean>;
  deleteHabit: (habitId: number) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetSettings: () => void;
  exportJson: () => string;
}

const HabitContext = createContext<HabitContextType | null>(null);

const messageOf = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong.');

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const profileLoaded = useRef(false);
  const pending = useRef(new Set<number>()); // habits with a complete/undo in flight

  // Settings: load once, then save on every change.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (raw) setProfile({ ...INITIAL_PROFILE, ...JSON.parse(raw) });
      } catch {
        // use defaults
      } finally {
        profileLoaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!profileLoaded.current) return;
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(() => {});
  }, [profile]);

  /** Fetches the list. `silent` keeps the current screen (no spinner) and ignores failures. */
  const load = useCallback(async (silent: boolean) => {
    if (!silent) {
      setStatus('loading');
      setError(null);
    }
    try {
      const dtos = await api.getHabits();
      setHabits((prev) => {
        const heatmaps = new Map(prev.map((h) => [h.id, h.heatmap]));
        return dtos.map((d) => habitFromDto(d, heatmaps.get(d.id) ?? null));
      });
      setStatus('ready');
      setError(null);
    } catch (e) {
      if (!silent) {
        setError(messageOf(e));
        setStatus('error');
      }
    }
  }, []);

  const reload = useCallback(() => load(false), [load]);

  useEffect(() => {
    load(false);
  }, [load]);

  // The day may have rolled over while the app was in the background, so refresh when it comes back.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') load(true);
    });
    return () => sub.remove();
  }, [load]);

  // Re-schedule local notifications whenever reminders could have changed.
  useEffect(() => {
    if (!ready || status !== 'ready') return;
    syncReminders(habits, profile).catch(() => {});
  }, [
    ready,
    status,
    profile.notificationsEnabled,
    profile.soundEffects,
    profile.morningReminder,
    profile.eveningCheckIn,
    habits.map((h) => `${h.id}|${h.title}|${h.reminderEnabled}|${JSON.stringify(h.schedule)}`).join(','),
  ]);

  const replaceHabit = (updated: Habit) =>
    setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));

  const loadHabitDetail = useCallback(async (habitId: number) => {
    try {
      const dto = await api.getHabit(habitId);
      setHabits((prev) => prev.map((h) => (h.id === habitId ? habitFromDto(dto) : h)));
    } catch {
      // The Detail screen keeps showing what it has; the next refresh will retry.
    }
  }, []);

  // Not optimistic: the server decides the new streak, so the UI renders its response.
  const toggleHabitToday = async (habitId: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || pending.current.has(habitId)) return;
    pending.current.add(habitId);
    try {
      const dto = habit.completedToday ? await api.undoHabit(habitId) : await api.completeHabit(habitId);
      replaceHabit(habitFromDto(dto, habit.heatmap));
    } catch (e) {
      Alert.alert('Could not update habit', messageOf(e));
    } finally {
      pending.current.delete(habitId);
    }
  };

  const createHabit = async (draft: HabitDraft) => {
    try {
      const dto = await api.createHabit(requestFromDraft(draft, draft.title));
      setHabits((prev) => [...prev, habitFromDto(dto)]);
      return true;
    } catch (e) {
      Alert.alert('Could not create habit', messageOf(e));
      return false;
    }
  };

  const updateHabit = async (habitId: number, draft: HabitDraft) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return false;
    try {
      // The title is immutable after creation, so the existing one is always sent back.
      const dto = await api.updateHabit(habitId, requestFromDraft(draft, habit.title, habit.isActive));
      replaceHabit(habitFromDto(dto, habit.heatmap));
      return true;
    } catch (e) {
      Alert.alert('Could not save habit', messageOf(e));
      return false;
    }
  };

  const deleteHabit = async (habitId: number) => {
    try {
      await api.deleteHabit(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
    } catch (e) {
      Alert.alert('Could not delete habit', messageOf(e));
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => setProfile((prev) => ({ ...prev, ...updates }));
  const resetSettings = () => setProfile(INITIAL_PROFILE);
  const exportJson = () => JSON.stringify({ profile, habits }, null, 2);

  return (
    <HabitContext.Provider
      value={{
        habits,
        profile,
        ready,
        status,
        error,
        reload,
        loadHabitDetail,
        toggleHabitToday,
        createHabit,
        updateHabit,
        deleteHabit,
        updateProfile,
        resetSettings,
        exportJson,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) throw new Error('useHabits must be used within HabitProvider');
  return context;
};
