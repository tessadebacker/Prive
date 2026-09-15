import type { Completion, Habit } from '../types';
import { formatDateShort, todayISO } from '../utils/date';
import { completionDatesFor, currentStreak, monthsStatus, weekProgress } from '../utils/habit';
import { WeekDots } from './WeekDots';

export function TodayHabitRow({
  habit,
  completions,
  onToggle,
}: {
  habit: Habit;
  completions: Completion[];
  onToggle: (habitId: string, date: string) => void;
}) {
  const today = todayISO();
  const dates = completionDatesFor(habit.id, completions);
  const done = dates.has(today);
  const streak = currentStreak(habit, completions);
  const week = weekProgress(habit, completions, today);
  const months = monthsStatus(habit, completions, today);

  return (
    <div className="habit-row">
      <button
        className={`check-circle${done ? ' done' : ''}`}
        onClick={() => onToggle(habit.id, today)}
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
        </div>
        {!months && <WeekDots dates={dates} />}
      </div>
      <span className="points-tag">+{habit.points}</span>
    </div>
  );
}
