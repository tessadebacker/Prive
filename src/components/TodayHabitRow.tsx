import type { Completion, Habit } from '../types';
import { formatDateShort, todayISO } from '../utils/date';
import {
  completionDatesFor,
  currentStreak,
  isSubtaskDoneOn,
  monthsStatus,
  subtaskProgress,
  weekProgress,
} from '../utils/habit';
import { WeekDots } from './WeekDots';

export function TodayHabitRow({
  habit,
  completions,
  onToggle,
  onSetDay,
}: {
  habit: Habit;
  completions: Completion[];
  onToggle: (habitId: string, date: string, subtaskId?: string) => void;
  onSetDay: (habitId: string, date: string, done: boolean) => void;
}) {
  const today = todayISO();
  const dates = completionDatesFor(habit, completions);
  const done = dates.has(today);
  const streak = currentStreak(habit, completions);
  const week = weekProgress(habit, completions, today);
  const months = monthsStatus(habit, completions, today);
  const progress = subtaskProgress(habit, completions, today);
  const hasSubtasks = habit.subtasks.length > 0;

  const topRow = (
    <div className="habit-row" style={hasSubtasks ? { border: 'none', padding: 0 } : undefined}>
      <button
        className={`check-circle${done ? ' done' : ''}`}
        onClick={() => (hasSubtasks ? onSetDay(habit.id, today, !done) : onToggle(habit.id, today))}
        aria-label={done ? 'Mark not done' : 'Mark done'}
      >
        ✓
      </button>
      <span className="habit-emoji">{habit.emoji}</span>
      <div className="habit-main">
        <div className={`habit-title${done ? ' done-strike' : ''}`}>{habit.title}</div>
        <div className="habit-meta">
          {streak > 0 && (
            <span className="streak-badge">
              🔥 {streak}
            </span>
          )}
          {week && (
            <span>
              {week.done}/{week.target} this week
            </span>
          )}
          {months && (
            <span className={months.overdue ? 'overdue' : undefined}>
              {months.lastDone ? `Last: ${formatDateShort(months.lastDone)}` : 'Not done yet'}
            </span>
          )}
          {progress && (
            <span>
              {progress.done}/{progress.total} today
            </span>
          )}
        </div>
        {!months && !hasSubtasks && <WeekDots dates={dates} />}
      </div>
      <span className="points-tag">+{habit.points}</span>
    </div>
  );

  if (!hasSubtasks) return topRow;

  return (
    <div className="card">
      {topRow}
      <div className="milestone-list">
        {habit.subtasks.map((s) => {
          const subDone = isSubtaskDoneOn(habit.id, s.id, today, completions);
          return (
            <div
              key={s.id}
              className={`milestone-row${subDone ? ' done' : ''}`}
              onClick={() => onToggle(habit.id, today, s.id)}
            >
              <span className={`mini-check${subDone ? ' done' : ''}`}>✓</span>
              <span className="mtext">{s.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
