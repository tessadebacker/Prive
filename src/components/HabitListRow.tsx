import { useState } from 'react';
import type { Completion, Habit } from '../types';
import { completionDatesFor, currentStreak, frequencyLabel, weekProgress } from '../utils/habit';
import { WeekDots } from './WeekDots';

export function HabitListRow({
  habit,
  completions,
  onEdit,
  onArchiveToggle,
  onDelete,
}: {
  habit: Habit;
  completions: Completion[];
  onEdit: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dates = completionDatesFor(habit.id, completions);
  const streak = currentStreak(habit, completions);
  const week = weekProgress(habit, completions);

  return (
    <div className="card">
      <div className="habit-row" style={{ border: 'none', padding: 0 }} onClick={() => setMenuOpen((v) => !v)}>
        <span className="habit-emoji">{habit.emoji}</span>
        <div className="habit-main">
          <div className={`habit-title${habit.archived ? ' archived' : ''}`}>{habit.title}</div>
          <div className="habit-meta">
            <span>{frequencyLabel(habit.frequency)}</span>
            {streak > 0 && <span className="streak-badge">🔥 {streak}</span>}
            {week && (
              <span>
                {week.done}/{week.target} this week
              </span>
            )}
          </div>
          <WeekDots dates={dates} />
        </div>
        <span className="points-tag">+{habit.points}</span>
      </div>

      {menuOpen && (
        <div className="row-menu">
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            Edit
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onArchiveToggle();
            }}
          >
            {habit.archived ? 'Unarchive' : 'Archive'}
          </button>
          <button
            className="btn btn-danger-outline btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
