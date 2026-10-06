import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useHabits } from '../context/HabitContext';
import { HeroBanner } from '../components/HeroBanner';
import { useThemeBg } from '../theme';
import { RootStackScreenProps } from '../navigation/types';
import { formatMonthYear, heatmapWeekStarts } from '../utils/dates';
import { isScheduledToday } from '../utils/habits';
import { MILESTONE_LADDER, milestoneLabel, nextMilestone } from '../utils/milestones';

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HabitDetailScreen = ({ route, navigation }: RootStackScreenProps<'HabitDetail'>) => {
  const { habitId } = route.params;
  const { habits, toggleHabitToday, loadHabitDetail } = useHabits();
  const bg = useThemeBg();
  const habit = habits.find((h) => h.id === habitId);

  // The heatmap only comes with the detail endpoint: fetch it when the screen shows (including after an edit)
  // and again whenever today's completion changes.
  useFocusEffect(
    useCallback(() => {
      loadHabitDetail(habitId);
    }, [habitId, loadHabitDetail])
  );
  const completedToday = habit?.completedToday;
  useEffect(() => {
    if (completedToday !== undefined) loadHabitDetail(habitId);
  }, [completedToday, habitId, loadHabitDetail]);

  // The habit can disappear (deleted elsewhere) while this screen is mounted.
  if (!habit) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.statLabel, { textAlign: 'center', marginTop: 40 }]}>Habit not found.</Text>
      </SafeAreaView>
    );
  }

  const weekStarts = heatmapWeekStarts();
  const upcoming = nextMilestone(habit.currentStreak);
  const scheduledToday = isScheduledToday(habit);

  const heatmap = habit.heatmap;
  const flat = heatmap ? heatmap.flat() : [];
  const doneCount = flat.filter((s) => s === 'done').length;
  const tracked = flat.filter((s) => s !== 'empty').length;
  const completionPct = tracked > 0 ? Math.round((doneCount / tracked) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Top Header Card */}
        <HeroBanner habitId={habit.id} height={120}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {habit.title}
            </Text>
          </View>
        </HeroBanner>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Current Streak vs Best Streak */}
          <View style={styles.dualCard}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Current Streak:</Text>
              <Text style={styles.statValue}>{habit.currentStreak} days</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Best Streak:</Text>
              <Text style={styles.statValue}>{habit.maxStreak} days</Text>
            </View>
          </View>

          {(habit.tags.length > 0 || habit.notes) && (
            <View style={styles.card}>
              {habit.tags.length > 0 && (
                <View style={[styles.tagRow, { marginTop: 0 }]}>
                  {habit.tags.map((t) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>#{t}</Text>
                    </View>
                  ))}
                </View>
              )}
              {habit.notes ? <Text style={styles.notesText}>{habit.notes}</Text> : null}
            </View>
          )}

          {/* Monthly Activity Heatmap Grid */}
          <View style={styles.card}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>{formatMonthYear()}</Text>
              <Text style={styles.legendText}>Last 5 weeks</Text>
            </View>

            {/* Column labels */}
            <View style={styles.dayLabelsRow}>
              <Text style={styles.axisSpace} />
              {DAY_HEADERS.map((d, i) => (
                <Text key={i} style={styles.dayHeaderLetter}>
                  {d}
                </Text>
              ))}
            </View>

            {/* 5x7 Cells */}
            {!heatmap && <Text style={styles.legendText}>Loading activity…</Text>}
            {(heatmap ?? []).map((week, wIdx) => (
              <View key={wIdx} style={styles.heatmapRow}>
                <Text style={styles.weekAxisNum}>{weekStarts[wIdx]}</Text>
                {week.map((status, dIdx) => (
                  <View
                    key={dIdx}
                    style={[
                      styles.cell,
                      status === 'done' && styles.cellDone,
                      status === 'missed' && styles.cellMissed,
                    ]}
                  />
                ))}
              </View>
            ))}

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.cellDone]} />
                <Text style={styles.legendText}>Done</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.cellMissed]} />
                <Text style={styles.legendText}>Missed</Text>
              </View>
            </View>
          </View>

          {/* Streak Milestones */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Streak Milestones</Text>
            <View style={styles.milestoneGrid}>
              {MILESTONE_LADDER.map((days, idx) => {
                const unlocked = habit.maxStreak >= days;
                return (
                  <View
                    key={idx}
                    style={[styles.milestoneBox, unlocked && styles.milestoneBoxUnlocked]}
                  >
                    {unlocked && (
                      <View style={styles.cornerCheck}>
                        <Ionicons name="checkmark" size={10} color="#0D1117" />
                      </View>
                    )}
                    <Text style={styles.milestoneTag}>{days === upcoming ? 'Next' : ' '}</Text>
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={unlocked ? '#34D399' : '#64748B'}
                    />
                    <Text style={styles.milestoneLabel}>{milestoneLabel(days)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Completion Stats */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Completion Stats</Text>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>Completion</Text>
                <Text style={styles.bigPct}>{completionPct}%</Text>
              </View>
              <View style={styles.statsRightCol}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressTrackFill, { width: `${completionPct}%` }]} />
                </View>
                <View style={styles.metaStatRow}>
                  <View>
                    <Text style={styles.statLabel}>Total days</Text>
                    <Text style={styles.metaStatBold}>{habit.unitLabel} ({habit.totalDaysCompleted})</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            disabled={!scheduledToday}
            style={[
              styles.actionBtnPrimary,
              habit.completedToday && styles.actionBtnDone,
              !scheduledToday && styles.actionBtnOff,
            ]}
            onPress={() => toggleHabitToday(habit.id)}
          >
            <Text style={styles.actionBtnText}>
              {!scheduledToday
                ? 'Not scheduled today'
                : habit.completedToday
                ? 'Completed Today ✓'
                : 'Mark Today Done'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => navigation.navigate('CreateHabit', { editHabitId: habit.id })}
          >
            <Text style={styles.actionSecondaryText}>Edit Habit</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0D1117' },
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  scrollContent: { padding: 14, gap: 12, paddingBottom: 60 },
  dualCard: {
    flexDirection: 'row',
    backgroundColor: '#161D26',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#26303D',
  },
  statCol: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: '#26303D' },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  card: {
    backgroundColor: '#161D26',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#26303D',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthTitle: { fontSize: 13, fontWeight: '600', color: '#F0F6FC' },
  dayLabelsRow: { flexDirection: 'row', gap: 6, marginBottom: 6, alignItems: 'center' },
  axisSpace: { width: 20 },
  dayHeaderLetter: { flex: 1, textAlign: 'center', fontSize: 10, color: '#8B949E', fontWeight: '600' },
  heatmapRow: { flexDirection: 'row', gap: 6, marginBottom: 6, alignItems: 'center' },
  weekAxisNum: { width: 20, fontSize: 9, color: '#64748B', textAlign: 'right', paddingRight: 4 },
  cell: { flex: 1, height: 26, borderRadius: 5, backgroundColor: '#1A222D' },
  cellDone: { backgroundColor: '#10B981' },
  cellMissed: { backgroundColor: '#EF4444' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#1A222D', borderWidth: 1, borderColor: '#26303D' },
  tagText: { fontSize: 11, color: '#94A3B8' },
  notesText: { fontSize: 12, color: '#94A3B8', marginTop: 6, lineHeight: 17 },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222C38' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11, color: '#94A3B8' },
  cardHeading: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', marginBottom: 10 },
  milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  milestoneBox: {
    width: '22%',
    height: 66,
    backgroundColor: '#141B24',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222B36',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  milestoneBoxUnlocked: { backgroundColor: '#1C2633', borderColor: '#2E424D' },
  cornerCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneTag: { fontSize: 8, color: '#94A3B8' },
  milestoneLabel: { fontSize: 10, color: '#CBD5E1' },
  statsRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  bigPct: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  statsRightCol: { flex: 1, gap: 10 },
  progressTrack: { height: 8, backgroundColor: '#232D3B', borderRadius: 4, overflow: 'hidden' },
  progressTrackFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  metaStatRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaStatBold: { fontSize: 12, fontWeight: '600', color: '#FFFFFF', marginTop: 2 },
  actionBtnPrimary: {
    backgroundColor: '#2EA073',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnOff: { opacity: 0.4 },
  actionBtnDone: { backgroundColor: '#285E4E' },
  actionBtnText: { color: '#0D1117', fontSize: 14, fontWeight: '700' },
  actionBtnSecondary: {
    backgroundColor: '#161D26',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B3746',
  },
  actionSecondaryText: { color: '#CBD5E1', fontSize: 14, fontWeight: '600' },
});
