import { HabitRequestDto, DayOfWeekDto } from './types';
import { ApiError } from './errors';
import { isEndAfterStart } from '../utils/time';

/**
 * Data rules for creating or updating a habit. They run before any POST or PUT, so bad data never reaches the
 * server. The length limits stay under the database's default text column size (255).
 */
export const LIMITS = {
  title: 60,
  description: 255,
  notes: 255,
  unitLabel: 30,
  tag: 20,
  tags: 10,
} as const;

const COLORS = ['GREEN', 'BLUE', 'PURPLE', 'SKY_BLUE', 'AMBER', 'ORANGE', 'RED', 'PINK'];
const DAYS: DayOfWeekDto[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour HH:mm
const TAG = /^[a-z0-9][a-z0-9_-]*$/;
const ICON = /^[a-z0-9-]+$/;

export type Field = 'title' | 'description' | 'notes' | 'unitLabel' | 'tags' | 'icon' | 'color' | 'frequency' | 'schedule';
export interface FieldError {
  field: Field;
  message: string;
}

export const validateHabitRequest = (r: HabitRequestDto): FieldError[] => {
  const errors: FieldError[] = [];
  const add = (field: Field, message: string) => errors.push({ field, message });

  // Text
  const title = (r.name ?? '').trim();
  if (!title) add('title', 'Give the habit a title.');
  else if (title.length > LIMITS.title) add('title', `The title can be at most ${LIMITS.title} characters.`);
  if ((r.description ?? '').length > LIMITS.description)
    add('description', `The description can be at most ${LIMITS.description} characters.`);
  if ((r.notes ?? '').length > LIMITS.notes) add('notes', `Notes can be at most ${LIMITS.notes} characters.`);
  const unit = (r.unitLabel ?? '').trim();
  if (!unit) add('unitLabel', 'Add a count label, for example "Days completed".');
  else if (unit.length > LIMITS.unitLabel) add('unitLabel', `The count label can be at most ${LIMITS.unitLabel} characters.`);

  // Look
  if (!r.icon || !ICON.test(r.icon)) add('icon', 'Pick an icon.');
  if (!COLORS.includes(r.color)) add('color', 'Pick a color.');

  // Tags
  const tags = r.tags ?? [];
  if (tags.length > LIMITS.tags) add('tags', `Use at most ${LIMITS.tags} tags.`);
  if (tags.some((t) => t.length > LIMITS.tag)) add('tags', `Each tag can be at most ${LIMITS.tag} characters.`);
  if (tags.some((t) => !TAG.test(t))) add('tags', 'Tags may use lowercase letters, numbers, "-" and "_" only.');
  if (new Set(tags).size !== tags.length) add('tags', 'Remove duplicate tags.');

  // Frequency and schedule
  if (r.frequencyType !== 'DAILY' && r.frequencyType !== 'WEEKLY') add('frequency', 'Choose Daily or Weekly.');
  const rows = r.habitSchedule ?? [];
  if (rows.length === 0) {
    add('schedule', 'Pick at least one day.');
  } else {
    const days = rows.map((s) => s.dayOfWeek);
    if (days.some((d) => !DAYS.includes(d))) add('schedule', 'One of the days is not valid.');
    if (new Set(days).size !== days.length) add('schedule', 'A day can only be scheduled once.');
    if (r.frequencyType === 'DAILY' && new Set(days).size !== 7) add('schedule', 'A daily habit must run on all 7 days.');

    const label = (d: string) => d.charAt(0) + d.slice(1, 3).toLowerCase();
    const badStart: string[] = [];
    const noEnd: string[] = [];
    const badEnd: string[] = [];
    const endBeforeStart: string[] = [];
    for (const s of rows) {
      if (!TIME.test(s.startTime)) {
        badStart.push(label(s.dayOfWeek));
        continue;
      }
      if (s.endTime === null || s.endTime === '') noEnd.push(label(s.dayOfWeek));
      else if (!TIME.test(s.endTime)) badEnd.push(label(s.dayOfWeek));
      else if (!isEndAfterStart(s.startTime, s.endTime)) endBeforeStart.push(label(s.dayOfWeek));
    }
    // One message per kind of problem, listing the days, so a daily habit doesn't repeat it seven times.
    if (badStart.length) add('schedule', `${badStart.join(', ')}: the start time must look like 07:30.`);
    if (noEnd.length) add('schedule', `${noEnd.join(', ')}: set an end time.`);
    if (badEnd.length) add('schedule', `${badEnd.join(', ')}: the end time must look like 08:00.`);
    if (endBeforeStart.length)
      add(
        'schedule',
        `${endBeforeStart.join(', ')}: the end time must be after the start time, on the same day (12:00 AM counts as the end of the day).`
      );
  }
  return errors;
};

/** Thrown before anything is sent. */
export class ValidationError extends ApiError {
  constructor(public errors: FieldError[]) {
    super(errors.map((e) => e.message).join('\n'), 400);
  }
}

export const assertValidHabit = (r: HabitRequestDto) => {
  const errors = validateHabitRequest(r);
  if (errors.length > 0) throw new ValidationError(errors);
};
