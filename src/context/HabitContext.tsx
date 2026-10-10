import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, UserProfile } from '../types';
import { INITIAL_PROFILE } from '../data/defaultProfile';
import { syncReminders } from '../utils/notifications';
import { api, ApiError } from '../api/client';
import { habitFromDto, requestFromDraft } from '../api/mappers';

// Settings live only on the device. Habits come from the server, but the last response is cached so the app can
// show something immediately while the server (which may be asleep) wakes up.
const PROFILE_KEY = 'habitat_profile_v1';
const CACHE_KEY = 'habitat_habits_cache_v1';

/** The fields a user edits in Create/Edit. Everything else comes from the server. */
export type HabitDraft = Pick<
  Habit,
  'title' | 'description' | 'notes' | 'icon' | 'color' | 'unitLabel' | 'tags' | 'frequency' | 'schedule' | 'reminderEnabled'
>;

/** 'loading': nothing to show yet. 'ready': habits are on screen (fresh or cached). 'error': failed with nothing to show. */
type Status = 'loading' | 'ready' | 'error';
/** Whether what's on screen has been confirmed by the server. */
type Sync = 'syncing' | 'synced' | 'offline';

interface HabitContextType {
  habits: Habit[];
  profile: UserProfile;
  /** Profile loaded from the device. */
  ready: boolean;
  status: Status;
  sync: Sync;
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
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const RETRY_MS = 20000;
const NOT_SYNCED_MESSAGE = 'The server is not connected yet. Try again in a moment.';

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>('loading');
  const [sync, setSync] = useState<Sync>('syncing');
  const [error, setError] = useState<string | null>(null);
  const profileLoaded = useRef(false);
  const hasFreshData = useRef(false); // a server response has arrived, so an older cache must not overwrite it
  const pending = useRef(new Set<number>()); // habits with a complete/undo in flight
  const habitsRef = useRef<Habit[]>([]); // latest habits, readable from async callbacks
  habitsRef.current = habits;

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

  // Show the cached habits right away (unless the server has already answered). It's read-only: the server stays the truth.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (!raw || hasFreshData.current) return;
        const cache = JSON.parse(raw) as { savedOn: string; habits: Habit[] };
        if (!Array.isArray(cache.habits) || cache.habits.length === 0) return;
        const sameDay = cache.savedOn === todayKey();
        // "Done today" from an earlier day is wrong, so never show it.
        setHabits(sameDay ? cache.habits : cache.habits.map((h) => ({ ...h, completedToday: false })));
        setStatus('ready');
      } catch {
        // no usable cache
      }
    })();
  }, []);

  // Save every confirmed state so the next launch has something to show.
  useEffect(() => {
    if (status !== 'ready' || sync !== 'synced') return;
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ savedOn: todayKey(), habits })).catch(() => {});
  }, [habits, status, sync]);

  /** Fetches the list. `silent` (foreground refresh) shows no banner and ignores failures. */
  const load = useCallback(async (silent: boolean) => {
    if (!silent) {
      setSync('syncing');
      setError(null);
    }
    try {
      const dtos = await api.getHabits();
      hasFreshData.current = true;
      setHabits((prev) => {
        const heatmaps = new Map(prev.map((h) => [h.id, h.heatmap]));
        return dtos.map((d) => habitFromDto(d, heatmaps.get(d.id) ?? null));
      });
      setStatus('ready');
      setSync('synced');
      setError(null);
    } catch (e) {
      if (silent) return;
      setError(messageOf(e));
      // With something on screen, keep it and show the offline banner; with nothing, show the retry screen.
      if (habitsRef.current.length === 0) setStatus('error');
      setSync('offline');
    }
  }, []);

  const reload = useCallback(() => load(false), [load]);

  // Start waking the server the moment the app opens, in parallel with reading the cache.
  useEffect(() => {
    load(false);
  }, [load]);

  // While offline, keep trying in the background: a cold start often finishes shortly after a timeout.
  useEffect(() => {
    if (sync !== 'offline') return;
    const t = setTimeout(() => load(false), RETRY_MS);
    return () => clearTimeout(t);
  }, [sync, load]);

  // The day may have rolled over while the app was in the background, so refresh when it comes back.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') load(true);
    });
    return () => sub.remove();
  }, [load]);

  // Re-schedule local notifications whenever reminders could have changed.
  useEffect(() => {
    if (!ready || sync !== 'synced') return;
    syncReminders(habits, profile).catch(() => {});
  }, [
    ready,
    sync,
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
      // The Detail screen keeps showing what it has (possibly cached); the next refresh will retry.
    }
  }, []);

  // Changes need the server, so they're refused until it has answered (the banner says why).
  const requireSynced = (title: string) => {
    if (sync === 'synced') return true;
    Alert.alert(title, NOT_SYNCED_MESSAGE);
    return false;
  };

  // Not optimistic: the server decides the new streak, so the UI renders its response.
  const toggleHabitToday = async (habitId: number) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || pending.current.has(habitId)) return;
    if (!requireSynced('Could not update habit')) return;
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
    if (!requireSynced('Could not create habit')) return false;
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
    if (!requireSynced('Could not save habit')) return false;
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
    if (!requireSynced('Could not delete habit')) return;
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
        sync,
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
