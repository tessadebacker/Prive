import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { AppState, Frequency, Goal, Habit, Milestone, Reward } from './types';
import { todayISO } from './utils/date';

const STORAGE_KEY = 'aim-tracker-state-v1';

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const initialState: AppState = {
  habits: [],
  goals: [],
  completions: [],
  rewards: [],
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return {
      habits: parsed.habits ?? [],
      goals: parsed.goals ?? [],
      completions: parsed.completions ?? [],
      rewards: parsed.rewards ?? [],
    };
  } catch {
    return initialState;
  }
}

type Action =
  | { type: 'ADD_HABIT'; habit: Habit }
  | { type: 'UPDATE_HABIT'; id: string; patch: Partial<Habit> }
  | { type: 'ARCHIVE_HABIT'; id: string; archived: boolean }
  | { type: 'DELETE_HABIT'; id: string }
  | { type: 'TOGGLE_COMPLETION'; habitId: string; date: string }
  | { type: 'ADD_GOAL'; goal: Goal }
  | { type: 'UPDATE_GOAL'; id: string; patch: Partial<Goal> }
  | { type: 'ARCHIVE_GOAL'; id: string; archived: boolean }
  | { type: 'DELETE_GOAL'; id: string }
  | { type: 'TOGGLE_MILESTONE'; goalId: string; milestoneId: string }
  | { type: 'ADD_MILESTONE'; goalId: string; title: string }
  | { type: 'SET_ACHIEVED'; goalId: string; achieved: boolean }
  | { type: 'ADD_REWARD'; reward: Reward }
  | { type: 'UPDATE_REWARD'; id: string; patch: Partial<Reward> }
  | { type: 'DELETE_REWARD'; id: string }
  | { type: 'CLAIM_REWARD'; id: string }
  | { type: 'UNCLAIM_REWARD'; id: string }
  | { type: 'IMPORT_STATE'; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.habit] };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.id ? { ...h, ...action.patch } : h)),
      };
    case 'ARCHIVE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === action.id ? { ...h, archived: action.archived } : h)),
      };
    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.id),
        completions: state.completions.filter((c) => c.habitId !== action.id),
      };
    case 'TOGGLE_COMPLETION': {
      const exists = state.completions.some(
        (c) => c.habitId === action.habitId && c.date === action.date
      );
      if (exists) {
        return {
          ...state,
          completions: state.completions.filter(
            (c) => !(c.habitId === action.habitId && c.date === action.date)
          ),
        };
      }
      return {
        ...state,
        completions: [
          ...state.completions,
          { id: uid(), habitId: action.habitId, date: action.date },
        ],
      };
    }
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.goal] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g)),
      };
    case 'ARCHIVE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.id ? { ...g, archived: action.archived } : g)),
      };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case 'TOGGLE_MILESTONE':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId
            ? {
                ...g,
                milestones: g.milestones.map((m: Milestone) =>
                  m.id === action.milestoneId ? { ...m, done: !m.done } : m
                ),
              }
            : g
        ),
      };
    case 'ADD_MILESTONE':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId
            ? { ...g, milestones: [...g.milestones, { id: uid(), title: action.title, done: false }] }
            : g
        ),
      };
    case 'SET_ACHIEVED':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId
            ? { ...g, achieved: action.achieved, achievedAt: action.achieved ? todayISO() : null }
            : g
        ),
      };
    case 'ADD_REWARD':
      return { ...state, rewards: [...state.rewards, action.reward] };
    case 'UPDATE_REWARD':
      return {
        ...state,
        rewards: state.rewards.map((r) => (r.id === action.id ? { ...r, ...action.patch } : r)),
      };
    case 'DELETE_REWARD':
      return { ...state, rewards: state.rewards.filter((r) => r.id !== action.id) };
    case 'CLAIM_REWARD':
      return {
        ...state,
        rewards: state.rewards.map((r) =>
          r.id === action.id ? { ...r, claimed: true, claimedAt: todayISO() } : r
        ),
      };
    case 'UNCLAIM_REWARD':
      return {
        ...state,
        rewards: state.rewards.map((r) =>
          r.id === action.id ? { ...r, claimed: false, claimedAt: null } : r
        ),
      };
    case 'IMPORT_STATE':
      return action.state;
    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  addHabit: (input: { title: string; emoji: string; frequency: Frequency; points: number }) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  archiveHabit: (id: string, archived: boolean) => void;
  deleteHabit: (id: string) => void;
  toggleCompletion: (habitId: string, date: string) => void;
  addGoal: (input: {
    title: string;
    emoji: string;
    description: string;
    targetDate: string | null;
    points: number;
  }) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  archiveGoal: (id: string, archived: boolean) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  addMilestone: (goalId: string, title: string) => void;
  setAchieved: (goalId: string, achieved: boolean) => void;
  addReward: (input: { title: string; emoji: string; cost: number }) => void;
  updateReward: (id: string, patch: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  claimReward: (id: string) => void;
  unclaimReward: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      addHabit: (input) =>
        dispatch({
          type: 'ADD_HABIT',
          habit: {
            id: uid(),
            kind: 'habit',
            title: input.title,
            emoji: input.emoji,
            frequency: input.frequency,
            points: input.points,
            createdAt: todayISO(),
            archived: false,
          },
        }),
      updateHabit: (id, patch) => dispatch({ type: 'UPDATE_HABIT', id, patch }),
      archiveHabit: (id, archived) => dispatch({ type: 'ARCHIVE_HABIT', id, archived }),
      deleteHabit: (id) => dispatch({ type: 'DELETE_HABIT', id }),
      toggleCompletion: (habitId, date) => dispatch({ type: 'TOGGLE_COMPLETION', habitId, date }),
      addGoal: (input) =>
        dispatch({
          type: 'ADD_GOAL',
          goal: {
            id: uid(),
            kind: 'goal',
            title: input.title,
            emoji: input.emoji,
            description: input.description,
            targetDate: input.targetDate,
            points: input.points,
            milestones: [],
            achieved: false,
            achievedAt: null,
            createdAt: todayISO(),
            archived: false,
          },
        }),
      updateGoal: (id, patch) => dispatch({ type: 'UPDATE_GOAL', id, patch }),
      archiveGoal: (id, archived) => dispatch({ type: 'ARCHIVE_GOAL', id, archived }),
      deleteGoal: (id) => dispatch({ type: 'DELETE_GOAL', id }),
      toggleMilestone: (goalId, milestoneId) => dispatch({ type: 'TOGGLE_MILESTONE', goalId, milestoneId }),
      addMilestone: (goalId, title) => dispatch({ type: 'ADD_MILESTONE', goalId, title }),
      setAchieved: (goalId, achieved) => dispatch({ type: 'SET_ACHIEVED', goalId, achieved }),
      addReward: (input) =>
        dispatch({
          type: 'ADD_REWARD',
          reward: {
            id: uid(),
            title: input.title,
            emoji: input.emoji,
            cost: input.cost,
            claimed: false,
            claimedAt: null,
            createdAt: todayISO(),
          },
        }),
      updateReward: (id, patch) => dispatch({ type: 'UPDATE_REWARD', id, patch }),
      deleteReward: (id) => dispatch({ type: 'DELETE_REWARD', id }),
      claimReward: (id) => dispatch({ type: 'CLAIM_REWARD', id }),
      unclaimReward: (id) => dispatch({ type: 'UNCLAIM_REWARD', id }),
    }),
    [state]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
