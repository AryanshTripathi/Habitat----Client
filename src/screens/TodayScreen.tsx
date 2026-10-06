import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../context/HabitContext';
import { HeroBanner } from '../components/HeroBanner';
import { useThemeBg } from '../theme';
import { TabScreenProps } from '../navigation/types';
import { greeting, formatToday, todayWeekdayIndex } from '../utils/dates';
import { accentOf, iconBgOf } from '../utils/colors';
import { isScheduledToday, pickFeatured } from '../utils/habits';
import { milestoneLabel, milestoneProgress, nextMilestone } from '../utils/milestones';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TodayScreen = ({ navigation }: TabScreenProps<'Today'>) => {
  const { habits, profile, toggleHabitToday, reload } = useHabits();
  const [refreshing, setRefreshing] = useState(false);
  const bg = useThemeBg();
  const featured = pickFeatured(habits);
  const listHabits = habits.filter((h) => h.id !== featured?.id);
  const todayIdx = todayWeekdayIndex();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Scenic Header */}
        <HeroBanner variant="misty" height={110}>
          <View style={styles.header}>
            <Text style={styles.greeting}>{greeting()}, {profile.name}</Text>
            <Text style={styles.dateText}>{formatToday()}</Text>
          </View>
        </HeroBanner>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor="#34D399"
              onRefresh={async () => {
                setRefreshing(true);
                await reload();
                setRefreshing(false);
              }}
            />
          }
        >
          {habits.length === 0 && (
            <Text style={styles.emptyText}>No habits yet — tap + to add one.</Text>
          )}

          {/* Featured card: the habit with the highest current streak */}
          {featured && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.heroCard}
              onPress={() => navigation.navigate('HabitDetail', { habitId: featured.id })}
            >
              <View style={styles.heroHeaderRow}>
                <View style={styles.rowAlign}>
                  <View style={styles.heroIconBox}>
                    <Ionicons name={featured.icon as any} size={22} color={accentOf(featured)} />
                  </View>
                  <View>
                    <Text style={styles.heroTitle}>{featured.title}</Text>
                    <Text style={styles.heroSub}>Tap today to log</Text>
                  </View>
                </View>
                <View style={styles.streakRight}>
                  <View style={styles.flameRow}>
                    <Ionicons name="flame" size={18} color="#F97316" />
                    <Text style={styles.flameText}>{featured.currentStreak} days</Text>
                  </View>
                  <Text style={styles.streakSub}>Current streak</Text>
                </View>
              </View>

              {/* Mon - Sun tracker: only today's circle can be toggled */}
              <View style={styles.weekRow}>
                {WEEK_DAYS.map((day, idx) => {
                  const done = featured.weekStatus[idx];
                  const isToday = idx === todayIdx;
                  const tappable = isToday && isScheduledToday(featured);
                  const circle = (
                    <View
                      style={[
                        styles.dayCircle,
                        done && styles.dayCircleDone,
                        isToday && !done && styles.dayCircleToday,
                      ]}
                    >
                      {done && <Ionicons name="checkmark" size={13} color="#0D1117" />}
                    </View>
                  );
                  return tappable ? (
                    <TouchableOpacity
                      key={day}
                      style={styles.dayCol}
                      onPress={() => toggleHabitToday(featured.id)}
                    >
                      <Text style={[styles.dayLabel, styles.dayLabelToday]}>{day}</Text>
                      {circle}
                    </TouchableOpacity>
                  ) : (
                    <View key={day} style={styles.dayCol}>
                      <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day}</Text>
                      {circle}
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          )}

          {/* Regular Habit Rows */}
          {listHabits.map((habit) => {
            const scheduled = isScheduledToday(habit);
            return (
              <TouchableOpacity
                key={habit.id}
                activeOpacity={0.8}
                style={styles.habitCard}
                onPress={() => navigation.navigate('HabitDetail', { habitId: habit.id })}
              >
                <View style={styles.habitTopRow}>
                  <View style={styles.rowAlign}>
                    <View style={[styles.habitIconBox, { backgroundColor: iconBgOf(habit) }]}>
                      <Ionicons name={habit.icon as any} size={20} color={accentOf(habit)} />
                    </View>
                    <View>
                      <Text style={styles.habitTitle}>{habit.title}</Text>
                      <Text style={styles.habitSubtitle}>{habit.totalDaysCompleted} days</Text>
                    </View>
                  </View>

                  <View style={styles.habitRight}>
                    <View style={styles.streakInfoCol}>
                      <Text style={styles.metaText}>
                        Current streak: <Text style={styles.metaBold}>{habit.currentStreak} days</Text>
                      </Text>
                      <Text style={styles.metaText}>
                        Next Milestone:{' '}
                        <Text style={styles.metaBold}>{milestoneLabel(nextMilestone(habit.currentStreak))}</Text>
                      </Text>
                    </View>

                    <TouchableOpacity
                      disabled={!scheduled}
                      style={[
                        styles.checkBtn,
                        habit.completedToday && styles.checkBtnDone,
                        !scheduled && styles.checkBtnOff,
                      ]}
                      onPress={() => toggleHabitToday(habit.id)}
                    >
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color={habit.completedToday ? '#34D399' : '#64748B'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress toward the next milestone */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${milestoneProgress(habit.currentStreak) * 100}%`,
                          backgroundColor: accentOf(habit),
                        },
                      ]}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Floating Action Button (+) */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CreateHabit')}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0D1117' },
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 12 },
  greeting: { fontSize: 21, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  dateText: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  scrollContent: { padding: 14, paddingBottom: 100, gap: 10 },
  heroCard: {
    backgroundColor: '#161D26',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#283240',
  },
  heroHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  rowAlign: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#252E3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  heroSub: { fontSize: 11, color: '#8B949E', marginTop: 1 },
  streakRight: { alignItems: 'flex-end' },
  flameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flameText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  streakSub: { fontSize: 10, color: '#8B949E', marginTop: 1 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#222B36' },
  dayCol: { alignItems: 'center', gap: 6, minWidth: 36, paddingVertical: 4 },
  dayLabel: { fontSize: 10, fontWeight: '600', color: '#8B949E' },
  dayCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#252E3A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333F4F',
  },
  dayCircleDone: { backgroundColor: '#10B981', borderColor: '#34D399' },
  dayCircleToday: { borderColor: '#34D399' },
  dayLabelToday: { color: '#E2E8F0' },
  habitCard: {
    backgroundColor: '#161D26',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#26303D',
  },
  habitTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  habitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: { fontSize: 14, fontWeight: '600', color: '#F0F6FC' },
  habitSubtitle: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  redText: { color: '#F87171' },
  greenText: { color: '#34D399' },
  habitRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakInfoCol: { alignItems: 'flex-end' },
  metaText: { fontSize: 10, color: '#94A3B8' },
  metaBold: { fontWeight: '600', color: '#E2E8F0' },
  checkBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnOff: { opacity: 0.35 },
  checkBtnDone: { backgroundColor: 'rgba(16,185,129,0.18)', borderColor: '#10B981' },
  progressContainer: { marginTop: 8, paddingLeft: 50 },
  progressBarBg: { height: 6, backgroundColor: '#232D3B', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  emptyText: { color: '#8B949E', textAlign: 'center', marginTop: 40, fontSize: 13 },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2D6A5B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});
