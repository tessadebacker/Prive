import type { Completion, Frequency, Habit } from '../types';
import { addDays, addMonths, startOfWeek, todayISO, weekdayOf } from './date';

export function isScheduledOn(frequency: Frequency, dateIso: string): boolean {
  if (frequency.kind === 'specificDays') {
    return frequency.days.includes(weekdayOf(dateIso));
  }
  return true; // daily and timesPerWeek are available every day
}

export function completionDatesFor(habitId: string, completions: Completion[]): Set<string> {
  const set = new Set<string>();
  for (const c of completions) {
    if (c.habitId === habitId) set.add(c.date);
  }
  return set;
}

export function weekProgress(
  habit: Habit,
  completions: Completion[],
  onDateIso: string = todayISO()
): { done: number; target: number } | null {
  if (habit.frequency.kind !== 'timesPerWeek') return null;
  const target = habit.frequency.count;
  const weekStart = startOfWeek(onDateIso);
  const dates = completionDatesFor(habit.id, completions);
  let done = 0;
  for (let i = 0; i < 7; i++) {
    if (dates.has(addDays(weekStart, i))) done++;
  }
  return { done, target };
}

export function currentStreak(habit: Habit, completions: Completion[]): number {
  if (habit.frequency.kind === 'everyNMonths') return 0; // day/week streaks aren't meaningful at this cadence

  const dates = completionDatesFor(habit.id, completions);
  const today = todayISO();

  if (habit.frequency.kind === 'timesPerWeek') {
    const target = habit.frequency.count;
    let streak = 0;
    let weekStart = startOfWeek(today);
    for (let i = 0; i < 260; i++) {
      let done = 0;
      for (let d = 0; d < 7; d++) {
        if (dates.has(addDays(weekStart, d))) done++;
      }
      const isCurrentWeek = weekStart === startOfWeek(today);
      if (done >= target) {
        streak++;
      } else if (isCurrentWeek) {
        // week still in progress, don't break the streak yet
      } else {
        break;
      }
      weekStart = addDays(weekStart, -7);
    }
    return streak;
  }

  let streak = 0;
  let cursor = today;
  for (let i = 0; i < 3650; i++) {
    const due = isScheduledOn(habit.frequency, cursor);
    if (due) {
      if (dates.has(cursor)) {
        streak++;
      } else if (cursor !== today) {
        break;
      }
      // if cursor === today and not done: today's still open, keep looking back
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function frequencyLabel(frequency: Frequency): string {
  if (frequency.kind === 'daily') return 'Every day';
  if (frequency.kind === 'timesPerWeek') return `${frequency.count}x per week`;
  if (frequency.kind === 'everyNMonths') {
    return frequency.months === 1 ? 'Every month' : `Every ${frequency.months} months`;
  }
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return frequency.days.map((d) => labels[d]).join(', ');
}

export interface MonthsStatus {
  lastDone: string | null;
  nextDue: string | null;
  overdue: boolean;
}

export function monthsStatus(
  habit: Habit,
  completions: Completion[],
  today: string = todayISO()
): MonthsStatus | null {
  if (habit.frequency.kind !== 'everyNMonths') return null;
  const dates = [...completionDatesFor(habit.id, completions)].sort();
  const lastDone = dates.length > 0 ? dates[dates.length - 1] : null;
  if (!lastDone) return { lastDone: null, nextDue: null, overdue: true };
  const nextDue = addMonths(lastDone, habit.frequency.months);
  return { lastDone, nextDue, overdue: today >= nextDue };
}
