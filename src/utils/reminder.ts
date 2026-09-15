import type { AppState } from '../types';
import { todayISO } from './date';

// Only nudge in the evening, once nothing's been logged for the day.
export const REMINDER_HOUR = 18;

export function hasTrackables(state: AppState): boolean {
  const hasActiveHabit = state.habits.some((h) => !h.archived);
  const hasActiveGoal = state.goals.some((g) => !g.archived && !g.achieved);
  return hasActiveHabit || hasActiveGoal;
}

export function hasLoggedToday(state: AppState): boolean {
  const today = todayISO();
  const habitLogged = state.completions.some((c) => {
    if (c.date !== today) return false;
    const habit = state.habits.find((h) => h.id === c.habitId);
    return !!habit && !habit.archived;
  });
  if (habitLogged) return true;
  return state.goalCheckIns.some((c) => {
    if (c.date !== today) return false;
    const goal = state.goals.find((g) => g.id === c.goalId);
    return !!goal && !goal.archived && !goal.achieved;
  });
}

export function shouldShowReminder(state: AppState, now: Date = new Date()): boolean {
  return hasTrackables(state) && !hasLoggedToday(state) && now.getHours() >= REMINDER_HOUR;
}
