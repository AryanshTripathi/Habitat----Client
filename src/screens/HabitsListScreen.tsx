import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../context/HabitContext';
import { useThemeBg } from '../theme';
import { HeroBanner } from '../components/HeroBanner';
import { HabitFrequency } from '../types';
import { accentOf, iconBgOf } from '../utils/colors';
import { isScheduledToday, scheduleSummary } from '../utils/habits';
import { TabScreenProps } from '../navigation/types';

type Filter = 'All' | HabitFrequency;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'Daily', label: 'Daily' },
  { key: 'Weekly', label: 'Weekly' },
];

export const HabitsListScreen = ({ navigation }: TabScreenProps<'Habits'>) => {
  const { habits, toggleHabitToday, deleteHabit } = useHabits();
  const bg = useThemeBg();
  const [filter, setFilter] = useState<Filter>('All');

  const filtered = habits.filter((h) => filter === 'All' || h.frequency === filter);

  const confirmDelete = (id: number, title: string) =>
    Alert.alert('Delete habit', `Delete "${title}" and its history?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(id) },
    ]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <HeroBanner variant="misty" height={120}>
        <View style={styles.bannerRow}>
          <View>
            <Text style={styles.title}>All Habits</Text>
            <Text style={styles.sub}>
              {habits.length} routines · {habits.filter((h) => h.completedToday).length} done today
            </Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('CreateHabit')}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.newText}>New</Text>
          </TouchableOpacity>
        </View>
      </HeroBanner>

      <View style={styles.filterWrap}>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 && <Text style={styles.empty}>No habits here yet.</Text>}
        {filtered.map((h) => (
          <TouchableOpacity
            key={h.id}
            activeOpacity={0.8}
            style={styles.card}
            onPress={() => navigation.navigate('HabitDetail', { habitId: h.id })}
          >
            <View style={styles.left}>
              <View style={[styles.iconBox, { backgroundColor: iconBgOf(h) }]}>
                <Ionicons name={h.icon as any} size={20} color={accentOf(h)} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.habitTitle} numberOfLines={1}>{h.title}</Text>
                <Text style={styles.habitMeta} numberOfLines={1}>{scheduleSummary(h)}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <View style={styles.streak}>
                <Ionicons name="flame" size={13} color="#F97316" />
                <Text style={styles.streakText}>{h.currentStreak}d</Text>
              </View>
              <TouchableOpacity
                disabled={!isScheduledToday(h)}
                style={[
                  styles.iconBtn,
                  h.completedToday && styles.iconBtnDone,
                  !isScheduledToday(h) && styles.iconBtnOff,
                ]}
                onPress={() => toggleHabitToday(h.id)}
              >
                <Ionicons name="checkmark" size={15} color={h.completedToday ? '#34D399' : '#64748B'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('CreateHabit', { editHabitId: h.id })}
              >
                <Ionicons name="create-outline" size={15} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(h.id, h.title)}>
                <Ionicons name="trash-outline" size={15} color="#F87171" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  bannerRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 19, fontWeight: '700', color: '#FFFFFF' },
  sub: { fontSize: 11, color: '#CBD5E1', marginTop: 2 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2D6857',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(73,157,133,0.4)',
  },
  newText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  filterWrap: { paddingHorizontal: 14, paddingTop: 12 },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#141B23',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#26303D',
  },
  filterBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 8 },
  filterBtnActive: { backgroundColor: '#212E3F' },
  filterText: { fontSize: 11, color: '#8B949E', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  list: { padding: 14, gap: 10, paddingBottom: 30 },
  empty: { color: '#8B949E', textAlign: 'center', marginTop: 30, fontSize: 13 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161D26',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#26303D',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  habitTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  habitMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 2 },
  streakText: { fontSize: 12, fontWeight: '600', color: '#F97316' },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#1B2430',
    borderWidth: 1,
    borderColor: '#2E3A48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnOff: { opacity: 0.35 },
  iconBtnDone: { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10B981' },
});
