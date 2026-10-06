import React from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../context/HabitContext';
import { THEME_BG } from '../theme';
import { ThemeVariant } from '../types';

const MORNING_TIMES = ['06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '09:00 AM'];
const EVENING_TIMES = ['08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'];
const THEMES: { key: ThemeVariant; label: string }[] = [
  { key: 'slate', label: 'Slate' },
  { key: 'navy', label: 'Navy' },
  { key: 'obsidian', label: 'Obsidian' },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const ToggleRow = ({
  icon,
  label,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon as any} size={18} color="#94A3B8" />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: '#2A3544', true: '#2D6857' }}
      thumbColor={value ? '#34D399' : '#8B949E'}
    />
  </View>
);

const Chips = ({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) => (
  <View style={styles.chipRow}>
    {options.map((o) => (
      <TouchableOpacity
        key={o}
        style={[styles.chip, value === o && styles.chipActive]}
        onPress={() => onSelect(o)}
      >
        <Text style={[styles.chipText, value === o && styles.chipTextActive]}>{o}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export const SettingsScreen = () => {
  const { profile, habits, updateProfile, resetSettings, exportJson } = useHabits();

  const handleExport = async () => {
    try {
      await Share.share({ title: 'Habitat backup', message: exportJson() });
    } catch {
      Alert.alert('Export failed', 'Could not open the share sheet.');
    }
  };

  const handleReset = () =>
    Alert.alert('Reset settings', 'This restores the default profile and notification settings. Your habits are not affected.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetSettings },
    ]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: THEME_BG[profile.themeVariant] }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Section title="Profile">
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={profile.name}
            onChangeText={(name) => updateProfile({ name })}
            placeholder="Your name"
            placeholderTextColor="#64748B"
          />
          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
            Daily target ({habits.length} habits tracked)
          </Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateProfile({ dailyTarget: Math.max(1, profile.dailyTarget - 1) })}
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepValue}>{profile.dailyTarget}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateProfile({ dailyTarget: Math.min(20, profile.dailyTarget + 1) })}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="Notifications">
          <ToggleRow
            icon="notifications-outline"
            label="Reminders"
            value={profile.notificationsEnabled}
            onChange={(v) => updateProfile({ notificationsEnabled: v })}
          />
          <ToggleRow
            icon="volume-high-outline"
            label="Sound"
            value={profile.soundEffects}
            onChange={(v) => updateProfile({ soundEffects: v })}
          />
          <ToggleRow
            icon="mail-outline"
            label="Weekly report"
            value={profile.weeklyReport}
            onChange={(v) => updateProfile({ weeklyReport: v })}
          />
          <Text style={styles.fieldLabel}>Morning reminder</Text>
          <Chips
            options={MORNING_TIMES}
            value={profile.morningReminder}
            onSelect={(morningReminder) => updateProfile({ morningReminder })}
          />
          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Evening check-in</Text>
          <Chips
            options={EVENING_TIMES}
            value={profile.eveningCheckIn}
            onSelect={(eveningCheckIn) => updateProfile({ eveningCheckIn })}
          />
        </Section>

        <Section title="Theme">
          <View style={styles.themeRow}>
            {THEMES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.themeBtn, profile.themeVariant === t.key && styles.themeBtnActive]}
                onPress={() => updateProfile({ themeVariant: t.key })}
              >
                <View style={[styles.swatch, { backgroundColor: THEME_BG[t.key] }]} />
                <Text style={[styles.themeText, profile.themeVariant === t.key && styles.themeTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="Data">
          <TouchableOpacity style={styles.row} onPress={handleExport}>
            <View style={styles.rowLeft}>
              <Ionicons name="share-outline" size={18} color="#94A3B8" />
              <Text style={styles.rowLabel}>Export backup (JSON)</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8B949E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={handleReset}>
            <View style={styles.rowLeft}>
              <Ionicons name="refresh-outline" size={18} color="#F87171" />
              <Text style={[styles.rowLabel, { color: '#F87171' }]}>Reset settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8B949E" />
          </TouchableOpacity>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { padding: 18, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6 },
  card: {
    backgroundColor: '#161D26',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#26303D',
    gap: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 14, fontWeight: '500', color: '#F0F6FC' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#E2E8F0', marginTop: 4 },
  input: {
    backgroundColor: '#0F151D',
    borderWidth: 1,
    borderColor: '#283342',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#212E3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', minWidth: 28, textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#1A222D',
    borderWidth: 1,
    borderColor: '#26303D',
  },
  chipActive: { backgroundColor: '#1A3B32', borderColor: '#2EA073' },
  chipText: { fontSize: 12, color: '#94A3B8' },
  chipTextActive: { color: '#34D399', fontWeight: '600' },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1A222D',
    borderWidth: 1,
    borderColor: '#26303D',
  },
  themeBtnActive: { borderColor: '#2EA073' },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#3A4757' },
  themeText: { fontSize: 12, color: '#94A3B8' },
  themeTextActive: { color: '#FFFFFF', fontWeight: '600' },
});
