import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../context/HabitContext';
import { useThemeBg } from '../theme';
import { TabScreenProps } from '../navigation/types';
import { COLOR_HEX, hexToRgba } from '../utils/colors';
import { api } from '../api/client';
import { ScheduleItem, scheduleItemFromDto } from '../api/mappers';
import { formatToday } from '../utils/dates';
import { formatTime, timeRange } from '../utils/time';

/** Today's schedule from GET /schedule/today (already ordered by start time). */
export const ScheduleScreen = ({ navigation }: TabScreenProps<'Schedule'>) => {
  const { habits, toggleHabitToday } = useHabits();
  const bg = useThemeBg();
  const [items, setItems] = useState<ScheduleItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems((await api.getTodaySchedule()).map(scheduleItemFromDto));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // Refresh whenever the tab is shown, so edits made elsewhere appear.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Completion lives in the habits state (it updates right after a toggle), so prefer it over the fetched value.
  const isDone = (item: ScheduleItem) => habits.find((h) => h.id === item.habitId)?.completedToday ?? item.completedToday;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: bg }]}>
        <Text style={styles.headerTitle}>TODAY&apos;S SCHEDULE</Text>
        <Text style={styles.headerSub}>{formatToday()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {items === null && !error && <ActivityIndicator color="#34D399" style={{ marginTop: 40 }} />}
        {error && (
          <TouchableOpacity onPress={load}>
            <Text style={styles.empty}>{error}{'\n'}Tap to retry.</Text>
          </TouchableOpacity>
        )}
        {items?.length === 0 && <Text style={styles.empty}>Nothing scheduled today.</Text>}

        {(items ?? []).map((item, index, all) => {
          const accent = COLOR_HEX[item.color];
          const done = isDone(item);
          const isLast = index === all.length - 1;
          return (
            <View key={item.habitId} style={styles.timelineRow}>
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{formatTime(item.startTime)}</Text>
              </View>

              <View style={styles.railColumn}>
                <TouchableOpacity
                  style={[styles.nodeDot, { backgroundColor: accent, borderColor: bg }]}
                  onPress={() => toggleHabitToday(item.habitId)}
                >
                  {done && <View style={[styles.nodeInner, { backgroundColor: bg }]} />}
                </TouchableOpacity>
                {!isLast && <View style={[styles.verticalLine, { backgroundColor: accent }]} />}
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.card,
                  {
                    backgroundColor: hexToRgba(accent, 0.12),
                    borderColor: hexToRgba(accent, 0.3),
                    borderLeftColor: accent,
                  },
                ]}
                onPress={() => navigation.navigate('HabitDetail', { habitId: item.habitId })}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name={item.icon as any} size={20} color={accent} />
                    </View>
                    <View style={{ flexShrink: 1 }}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardTime}>{timeRange(item.startTime, item.endTime)}</Text>
                      {item.description ? (
                        <Text style={styles.cardSubtitle} numberOfLines={1}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.checkBtn, done && { backgroundColor: accent, borderColor: accent }]}
                    onPress={() => toggleHabitToday(item.habitId)}
                  >
                    <Ionicons name="checkmark" size={16} color={done ? '#0D1117' : '#64748B'} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingTop: 16,
    paddingBottom: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#161F2C',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.2 },
  headerSub: { fontSize: 13, color: '#8B949E', marginTop: 3, fontWeight: '500' },
  scrollContent: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 70 },
  empty: { color: '#8B949E', textAlign: 'center', marginTop: 40, fontSize: 13 },
  timelineRow: { flexDirection: 'row', minHeight: 84 },
  timeBox: { width: 68, alignItems: 'flex-end', paddingRight: 10, paddingTop: 14 },
  timeText: { fontSize: 11, fontWeight: '700', color: '#8B949E' },
  railColumn: { width: 22, alignItems: 'center', position: 'relative' },
  nodeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    marginTop: 14,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeInner: { width: 4, height: 4, borderRadius: 2 },
  verticalLine: { position: 'absolute', top: 24, bottom: -14, width: 2, opacity: 0.6 },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderLeftWidth: 4,
    justifyContent: 'center',
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  cardTime: { fontSize: 11, fontWeight: '600', color: '#CBD5E1', marginTop: 2 },
  cardSubtitle: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  checkBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
