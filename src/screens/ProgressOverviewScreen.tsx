import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../context/HabitContext';
import { useThemeBg } from '../theme';
import { TabScreenProps } from '../navigation/types';
import { accentOf, iconBgOf } from '../utils/colors';
import { isScheduledToday } from '../utils/habits';
import { ProgressRing } from '../components/ProgressRing';

export const ProgressOverviewScreen = ({ navigation }: TabScreenProps<'Progress'>) => {
  const { habits } = useHabits();
  const bg = useThemeBg();

  const sorted = [...habits].sort((a, b) => b.currentStreak - a.currentStreak);
  const bestGlobal = sorted[0]?.currentStreak ?? 0;
  const activeStreaks = habits.filter((h) => h.currentStreak > 0).length;
  const totalDays = habits.reduce((n, h) => n + h.totalDaysCompleted, 0);
  // Ring = today's completion: habits done today out of habits scheduled today.
  const scheduledToday = habits.filter(isScheduledToday);
  const doneScheduled = scheduledToday.filter((h) => h.completedToday).length;
  const completionPct =
    scheduledToday.length > 0 ? Math.round((doneScheduled / scheduledToday.length) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress Overview</Text>
          <Text style={styles.headerSub}>Global consistency & active streaks</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Global Streaks */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Global Streaks</Text>

            <View style={styles.tripleStats}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Active</Text>
                <Text style={styles.statNumber}>{activeStreaks}</Text>
                <Text style={styles.statUnit}>active streaks</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Longest current</Text>
                <Text style={styles.statNumber}>{bestGlobal} days</Text>
                <Text style={styles.statUnit}>from {sorted[0]?.title ?? '—'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total days</Text>
                <Text style={styles.statNumber}>{totalDays}</Text>
                <Text style={styles.statUnit}>all habits</Text>
              </View>
            </View>
          </View>

          {/* Completion Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Completion Summary</Text>
            <Text style={styles.cardSub}>Habits done today</Text>

            <View style={styles.ringRow}>
              <ProgressRing percent={completionPct} label="Today" />

              <View style={styles.breakdownCol}>
                <View>
                  <Text style={styles.breakdownLabel}>Done today</Text>
                  <Text style={styles.breakdownValue}>{doneScheduled} of {scheduledToday.length}</Text>
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Total completions</Text>
                  <Text style={styles.breakdownValue}>{totalDays} days</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Streak Leaderboard */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Streak Leaderboard</Text>
            {sorted.map((habit, idx) => (
              <TouchableOpacity
                key={habit.id}
                style={styles.leaderRow}
                onPress={() => navigation.navigate('HabitDetail', { habitId: habit.id })}
              >
                <View style={styles.rowAlign}>
                  <Text style={styles.rankNum}>{idx + 1}</Text>
                  <View style={[styles.leaderIcon, { backgroundColor: iconBgOf(habit) }]}>
                    <Ionicons name={habit.icon as any} size={15} color={accentOf(habit)} />
                  </View>
                  <Text style={styles.leaderTitle}>{habit.title}</Text>
                </View>
                <Text style={styles.leaderStreak}>{habit.currentStreak} days</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0D1117' },
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { padding: 18, backgroundColor: '#131A26' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  scrollContent: { padding: 14, gap: 12, paddingBottom: 60 },
  card: {
    backgroundColor: '#161D26',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#26303D',
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  cardSub: { fontSize: 12, fontWeight: '600', color: '#CBD5E1', marginTop: 4, marginBottom: 12 },
  tripleStats: { flexDirection: 'row', marginTop: 14 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#242E3C' },
  statLabel: { fontSize: 10, color: '#94A3B8' },
  statNumber: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginTop: 4 },
  statUnit: { fontSize: 10, color: '#8B949E', marginTop: 2 },
  ringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  breakdownCol: { gap: 12 },
  breakdownLabel: { fontSize: 11, color: '#94A3B8' },
  breakdownValue: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  leaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222B36',
  },
  rowAlign: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankNum: { width: 16, fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  leaderIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  leaderTitle: { fontSize: 13, color: '#F0F6FC', fontWeight: '500' },
  leaderStreak: { fontSize: 12, fontWeight: '600', color: '#CBD5E1' },
});
