import type { Goal, GoalCheckIn } from '../types';
import { addDays, todayISO } from './date';

export function goalCheckInDatesFor(goalId: string, checkIns: GoalCheckIn[]): Set<string> {
  const set = new Set<string>();
  for (const c of checkIns) {
    if (c.goalId === goalId) set.add(c.date);
  }
  return set;
}

export function goalCurrentStreak(goal: Goal, checkIns: GoalCheckIn[]): number {
  const dates = goalCheckInDatesFor(goal.id, checkIns);
  const today = todayISO();
  let streak = 0;
  let cursor = today;
  for (let i = 0; i < 3650; i++) {
    if (dates.has(cursor)) {
      streak++;
    } else if (cursor !== today) {
      break;
    }
    // if cursor === today and not checked in yet, today's still open, keep looking back
    cursor = addDays(cursor, -1);
  }
  return streak;
}
