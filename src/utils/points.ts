import type { AppState } from '../types';

const POINTS_PER_LEVEL = 100;

export function totalPointsEarned(state: AppState): number {
  const habitPoints = state.completions.reduce((sum, c) => {
    const habit = state.habits.find((h) => h.id === c.habitId);
    return sum + (habit ? habit.points : 0);
  }, 0);
  const goalPoints = state.goals
    .filter((g) => g.achieved)
    .reduce((sum, g) => sum + g.points, 0);
  return habitPoints + goalPoints;
}

export function pointsSpent(state: AppState): number {
  return state.rewards
    .filter((r) => r.claimed)
    .reduce((sum, r) => sum + r.cost, 0);
}

export function availablePoints(state: AppState): number {
  return totalPointsEarned(state) - pointsSpent(state);
}

export function levelFor(points: number): { level: number; intoLevel: number; toNext: number } {
  const level = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const intoLevel = points % POINTS_PER_LEVEL;
  return { level, intoLevel, toNext: POINTS_PER_LEVEL - intoLevel };
}

export { POINTS_PER_LEVEL };
