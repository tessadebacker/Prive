export type Frequency =
  | { kind: 'daily' }
  | { kind: 'timesPerWeek'; count: number }
  | { kind: 'specificDays'; days: number[] }; // 0 = Sunday .. 6 = Saturday

export interface Habit {
  id: string;
  kind: 'habit';
  title: string;
  emoji: string;
  frequency: Frequency;
  points: number;
  createdAt: string;
  archived: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  done: boolean;
}

export interface Goal {
  id: string;
  kind: 'goal';
  title: string;
  emoji: string;
  description: string;
  targetDate: string | null;
  points: number;
  milestones: Milestone[];
  achieved: boolean;
  achievedAt: string | null;
  createdAt: string;
  archived: boolean;
}

export interface Completion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD, local
}

export interface Reward {
  id: string;
  title: string;
  emoji: string;
  cost: number;
  claimed: boolean;
  claimedAt: string | null;
  createdAt: string;
}

export interface AppState {
  habits: Habit[];
  goals: Goal[];
  completions: Completion[];
  rewards: Reward[];
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const HABIT_EMOJIS = ['💪', '🏃', '🧘', '📚', '💧', '🥗', '😴', '🧹', '✍️', '🎯'];
export const GOAL_EMOJIS = ['🚤', '🎓', '🏔️', '✈️', '🏡', '💼', '🎸', '🏆', '🌱', '🎯'];
export const REWARD_EMOJIS = ['🎁', '☕', '🍰', '🎬', '📀', '👟', '🍔', '🛍️', '🧴', '🌴'];
