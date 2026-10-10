import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useHabits, HabitDraft } from '../context/HabitContext';
import { requestFromDraft } from '../api/mappers';
import { Field, LIMITS, validateHabitRequest } from '../api/validation';
import { HabitColor, HabitFrequency } from '../types';
import { RootStackScreenProps } from '../navigation/types';
import { useThemeBg } from '../theme';
import { COLOR_HEX, COLOR_KEYS, DEFAULT_COLOR } from '../utils/colors';
import { dayShort, defaultEnd, formatTime, hhmmToDate, isEndAfterStart, shiftEnd, toHHmm } from '../utils/time';

const FREQUENCIES: HabitFrequency[] = ['Daily', 'Weekly'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_START = '20:00';

const ICONS = [
  'book-outline',
  'walk-outline',
  'flower-outline',
  'water-outline',
  'document-text-outline',
  'fitness-outline',
  'code-slash-outline',
  'barbell-outline',
  'bicycle-outline',
  'moon-outline',
  'nutrition-outline',
  'musical-notes-outline',
  'globe-outline',
  'color-palette-outline',
  'medkit-outline',
  'wallet-outline',
  'sunny-outline',
  'headset-outline',
  'heart-outline',
  'leaf-outline',
  'locate-outline',
  'trophy-outline',
  'cafe-outline',
  'flame-outline',
];

type Times = { start: string; end: string };
const DEFAULT_TIMES: Times = { start: DEFAULT_START, end: defaultEnd(DEFAULT_START) };
type PickerTarget = { day: number; field: 'start' | 'end' };

export const CreateHabitScreen = ({ route, navigation }: RootStackScreenProps<'CreateHabit'>) => {
  const editHabitId = route.params?.editHabitId;
  const { habits, createHabit, updateHabit } = useHabits();
  const bg = useThemeBg();
  const existing = habits.find((h) => h.id === editHabitId);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [unitLabel, setUnitLabel] = useState(existing?.unitLabel ?? 'Days completed');
  const [tagsText, setTagsText] = useState((existing?.tags ?? []).join(', '));
  const [frequency, setFrequency] = useState<HabitFrequency>(existing?.frequency ?? 'Daily');
  const [icon, setIcon] = useState(existing?.icon ?? 'book-outline');
  const [color, setColor] = useState<HabitColor>(existing?.color ?? DEFAULT_COLOR);
  const [reminderEnabled, setReminderEnabled] = useState(existing?.reminderEnabled ?? true);

  // Per-day start/end times for the days the habit runs on.
  const [times, setTimes] = useState<Record<number, Times>>(() => {
    if (existing) {
      return Object.fromEntries(existing.schedule.map((r) => [r.day, { start: r.startTime, end: r.endTime }]));
    }
    return Object.fromEntries(ALL_DAYS.map((d) => [d, { ...DEFAULT_TIMES }]));
  });
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false); // errors show only after the first Save attempt, then stay live

  const selectedDays = Object.keys(times).map(Number).sort((a, b) => a - b);

  const changeFrequency = (f: HabitFrequency) => {
    setFrequency(f);
    if (f === 'Daily') {
      // Daily means all 7 days; new days copy the first existing row's times.
      const base = times[selectedDays[0]] ?? DEFAULT_TIMES;
      setTimes(Object.fromEntries(ALL_DAYS.map((d) => [d, times[d] ?? { ...base }])));
    }
  };

  const toggleDay = (d: number) => {
    if (frequency === 'Daily') return;
    setTimes((prev) => {
      const next = { ...prev };
      if (next[d]) delete next[d];
      else {
        const base = prev[selectedDays[0]] ?? DEFAULT_TIMES;
        next[d] = { ...base };
      }
      return next;
    });
  };

  const applyFirstToAll = () => {
    const base = times[selectedDays[0]];
    if (!base) return;
    setTimes(Object.fromEntries(selectedDays.map((d) => [d, { ...base }])));
  };

  /**
   * Moving the start moves the end with it (same length, capped at 12:00 AM). Setting the end directly is refused if
   * it isn't after the start on the same day; the only way to reach midnight is 12:00 AM (00:00).
   */
  const setTime = (target: PickerTarget, value: string) => {
    const current = times[target.day];
    if (target.field === 'start') {
      setTimes((prev) => ({
        ...prev,
        [target.day]: { start: value, end: shiftEnd(current.start, current.end, value) },
      }));
      return;
    }
    if (!isEndAfterStart(current.start, value)) {
      Alert.alert(
        'Check the times',
        `${dayShort(target.day)}: the end time must be after the start time, on the same day. Use 12:00 AM for the end of the day.`
      );
      return;
    }
    setTimes((prev) => ({ ...prev, [target.day]: { ...prev[target.day], end: value } }));
  };

  const onPick = (target: PickerTarget, event: { type: string }, date?: Date) => {
    // Android shows a dialog and reports 'set' or 'dismissed'; iOS shows an inline spinner that reports every change.
    if (Platform.OS !== 'ios') setPicker(null);
    if (event.type === 'dismissed' || !date) return;
    setTime(target, toHHmm(date));
  };

  // Web has no native time picker, so it gets a plain HH:mm field.
  const [webText, setWebText] = useState('');
  const openPicker = (target: PickerTarget) => {
    const t = times[target.day];
    setWebText(target.field === 'start' ? t.start : t.end);
    setPicker(target);
  };
  const applyWebTime = () => {
    if (!picker) return;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(webText)) {
      Alert.alert('Invalid time', 'Use 24-hour HH:mm, for example 07:30 or 21:00.');
      return;
    }
    setTime(picker, webText);
    setPicker(null);
  };

  const buildDraft = (): HabitDraft => ({
    title: title.trim(),
    description: description.trim(),
    notes: notes.trim(),
    icon,
    color,
    unitLabel: unitLabel.trim(),
    tags: Array.from(
      new Set(
        tagsText
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      )
    ),
    frequency,
    reminderEnabled,
    schedule: selectedDays.map((day) => ({ day, startTime: times[day].start, endTime: times[day].end })),
  });

  // The same rules the API layer enforces before any POST or PUT, shown here next to the fields.
  const errors = submitted ? validateHabitRequest(requestFromDraft(buildDraft(), title.trim(), true)) : [];
  const renderErr = (field: Field) =>
    errors
      .filter((e) => e.field === field)
      .map((e) => (
        <Text key={e.message} style={styles.error}>
          {e.message}
        </Text>
      ));

  const handleSave = async () => {
    setSubmitted(true);
    const draft = buildDraft();
    if (validateHabitRequest(requestFromDraft(draft, draft.title, true)).length > 0) return;
    setSaving(true);
    const ok = existing ? await updateHabit(existing.id, draft) : await createHabit(draft);
    setSaving(false);
    if (ok) navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{existing ? 'Edit Habit' : 'Create a New Habit'}</Text>
          <View style={{ width: 20 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={[styles.input, existing && styles.inputLocked]}
            value={title}
            maxLength={LIMITS.title}
            onChangeText={setTitle}
            editable={!existing}
            placeholder="e.g. Read"
            placeholderTextColor="#64748B"
          />
          {existing && <Text style={styles.hint}>The title can't be changed after a habit is created.</Text>}
          {renderErr('title')}

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            maxLength={LIMITS.description}
            onChangeText={setDescription}
            placeholder="What does this habit involve?"
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={3}
          />

          {renderErr('description')}

          <Text style={styles.label}>Frequency</Text>
          <View style={styles.freqRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
                onPress={() => changeFrequency(f)}
              >
                <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Days and per-day times */}
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Days & times</Text>
            {selectedDays.length > 1 && (
              <TouchableOpacity onPress={applyFirstToAll}>
                <Text style={styles.link}>Apply first to all</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.scheduleBox}>
            {ALL_DAYS.map((d) => {
              const on = !!times[d];
              const locked = frequency === 'Daily';
              return (
                <View key={d} style={styles.dayRow}>
                  <TouchableOpacity
                    disabled={locked}
                    style={[styles.dayChip, on && styles.chipActive]}
                    onPress={() => toggleDay(d)}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextActive]}>{dayShort(d)}</Text>
                  </TouchableOpacity>
                  {on ? (
                    <View style={styles.timeCells}>
                      <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker({ day: d, field: 'start' })}>
                        <Text style={styles.timeText}>{formatTime(times[d].start)}</Text>
                      </TouchableOpacity>
                      <Text style={styles.dash}>–</Text>
                      <TouchableOpacity
                        style={styles.timeBtn}
                        onPress={() => openPicker({ day: d, field: 'end' })}
                      >
                        <Text style={styles.timeText}>{formatTime(times[d].end)}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.offText}>Off</Text>
                  )}
                </View>
              );
            })}
          </View>

          {renderErr('schedule')}
          {renderErr('frequency')}

          {picker && times[picker.day] && Platform.OS === 'web' && (
            <View style={styles.webTimeBox}>
              <Text style={styles.hint}>
                {dayShort(picker.day)} {picker.field === 'start' ? 'start' : 'end'} time (24-hour HH:mm)
              </Text>
              <View style={styles.webTimeRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={webText}
                  onChangeText={setWebText}
                  placeholder="HH:mm"
                  placeholderTextColor="#64748B"
                  onSubmitEditing={applyWebTime}
                />
                <TouchableOpacity style={styles.doneBtn} onPress={applyWebTime}>
                  <Text style={styles.doneText}>Set</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.doneBtn} onPress={() => setPicker(null)}>
                  <Text style={[styles.doneText, { color: '#94A3B8' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {picker && times[picker.day] && Platform.OS !== 'web' && (
            <View>
              <DateTimePicker
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant="dark"
                value={hhmmToDate(picker.field === 'start' ? times[picker.day].start : times[picker.day].end)}
                onChange={(e, date) => onPick(picker, e, date)}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.doneBtn} onPress={() => setPicker(null)}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Reminders</Text>
              <Text style={styles.hint}>Alerts at each day's start time. Off silences every day.</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: '#2A3544', true: '#2D6857' }}
              thumbColor={reminderEnabled ? '#34D399' : '#8B949E'}
            />
          </View>

          <Text style={styles.label}>Color</Text>
          {renderErr('color')}
          <View style={styles.colorRow}>
            {COLOR_KEYS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: COLOR_HEX[c] }, color === c && styles.colorDotActive]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          <Text style={styles.label}>Icon Selection</Text>
          {renderErr('icon')}
          <View style={styles.iconGrid}>
            {ICONS.map((i) => (
              <TouchableOpacity
                key={i}
                style={[styles.iconTile, icon === i && styles.iconTileActive]}
                onPress={() => setIcon(i)}
              >
                <Ionicons name={i as any} size={16} color={icon === i ? '#34D399' : '#94A3B8'} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Count label</Text>
          <TextInput
            style={styles.input}
            value={unitLabel}
            maxLength={LIMITS.unitLabel}
            onChangeText={setUnitLabel}
            placeholder="Days completed"
            placeholderTextColor="#64748B"
          />

          {renderErr('unitLabel')}

          <Text style={styles.label}>Tags</Text>
          <TextInput
            style={styles.input}
            value={tagsText}
            onChangeText={setTagsText}
            placeholder="comma, separated"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
          />

          {renderErr('tags')}

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.input}
            value={notes}
            maxLength={LIMITS.notes}
            onChangeText={setNotes}
            placeholder="Goal notes"
            placeholderTextColor="#64748B"
          />

          {renderErr('notes')}

          {errors.length > 0 && (
            <Text style={styles.error}>Fix the {errors.length === 1 ? 'issue' : `${errors.length} issues`} above to save.</Text>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} disabled={saving} onPress={handleSave}>
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    height: 70,
    backgroundColor: '#1E2529',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 50 },
  label: { fontSize: 12, fontWeight: '600', color: '#E2E8F0', marginTop: 6 },
  error: { fontSize: 11, color: '#F87171', marginTop: 2 },
  hint: { fontSize: 11, color: '#8B949E', marginTop: 2 },
  link: { fontSize: 12, color: '#34D399', fontWeight: '600' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  input: {
    backgroundColor: '#161D26',
    borderWidth: 1,
    borderColor: '#283342',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#FFFFFF',
  },
  inputLocked: { color: '#64748B', backgroundColor: '#11171F' },
  textArea: { height: 75, textAlignVertical: 'top' },
  freqRow: {
    flexDirection: 'row',
    backgroundColor: '#141B23',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#26303D',
  },
  freqBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  freqBtnActive: { backgroundColor: '#212E3F' },
  freqText: { fontSize: 12, color: '#8B949E', fontWeight: '500' },
  freqTextActive: { color: '#FFFFFF' },
  scheduleBox: {
    backgroundColor: '#141B23',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242E3B',
    padding: 10,
    gap: 8,
  },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayChip: {
    width: 52,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1A222D',
    borderWidth: 1,
    borderColor: '#26303D',
  },
  chipActive: { backgroundColor: '#1A3B32', borderColor: '#2EA073' },
  chipText: { fontSize: 11, color: '#94A3B8' },
  chipTextActive: { color: '#34D399', fontWeight: '600' },
  timeCells: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  timeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1A222D',
    borderWidth: 1,
    borderColor: '#26303D',
  },
  timeText: { fontSize: 12, color: '#FFFFFF', fontWeight: '500' },
  timeMuted: { color: '#64748B', fontWeight: '400' },
  dash: { color: '#64748B' },
  offText: { fontSize: 12, color: '#475569' },
  webTimeBox: { gap: 6 },
  webTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneBtn: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 8 },
  doneText: { color: '#34D399', fontWeight: '700' },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#FFFFFF' },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#141B23',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242E3B',
  },
  iconTile: {
    width: '10.5%',
    height: 34,
    backgroundColor: '#1A222D',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#26303D',
  },
  iconTileActive: { backgroundColor: '#1A3B32', borderColor: '#2EA073' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#2D6857',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#161D26',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3544',
  },
  cancelText: { color: '#CBD5E1', fontWeight: '600', fontSize: 14 },
});
