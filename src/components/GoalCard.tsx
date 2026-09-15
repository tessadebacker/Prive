import { useState } from 'react';
import type { Goal } from '../types';
import { daysBetween, formatDateShort, isPastDate, todayISO } from '../utils/date';
import { ProgressBar } from './ProgressBar';

export function GoalCard({
  goal,
  compact = false,
  onClick,
  checkedToday,
  streak,
  onToggleCheckIn,
  onToggleMilestone,
  onAddMilestone,
  onSetAchieved,
  onEdit,
  onArchiveToggle,
  onDelete,
}: {
  goal: Goal;
  compact?: boolean;
  onClick?: () => void;
  checkedToday?: boolean;
  streak?: number;
  onToggleCheckIn?: () => void;
  onToggleMilestone?: (milestoneId: string) => void;
  onAddMilestone?: (title: string) => void;
  onSetAchieved?: (achieved: boolean) => void;
  onEdit?: () => void;
  onArchiveToggle?: () => void;
  onDelete?: () => void;
}) {
  const [newMilestone, setNewMilestone] = useState('');
  const total = goal.milestones.length;
  const done = goal.milestones.filter((m) => m.done).length;
  const pct = total > 0 ? (done / total) * 100 : goal.achieved ? 100 : 0;
  const overdue = goal.targetDate && !goal.achieved && isPastDate(goal.targetDate);
  const daysLeft = goal.targetDate ? daysBetween(todayISO(), goal.targetDate) : null;

  return (
    <div className="card goal-card" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="goal-top">
        {onToggleCheckIn && (
          <button
            className={`check-circle${checkedToday ? ' done' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCheckIn();
            }}
            aria-label={checkedToday ? 'Unmark worked on today' : 'Mark worked on today'}
          >
            ✓
          </button>
        )}
        <span className="habit-emoji">{goal.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="goal-title-row">
            <span className="goal-title">{goal.title}</span>
            {goal.achieved && <span className="tag-achieved">Achieved 🎉</span>}
          </div>
          {goal.description && <p className="goal-desc">{goal.description}</p>}
        </div>
        {!compact && <span className="points-tag">+{goal.points}</span>}
      </div>

      <div className="goal-meta-row">
        {!!streak && streak > 0 && <span className="streak-badge">🔥 {streak}</span>}
        {onToggleCheckIn && !!goal.dailyPoints && (
          <span>+{goal.dailyPoints}/day worked on</span>
        )}
        {goal.targetDate && !goal.achieved && (
          <span className={overdue ? 'overdue' : undefined}>
            {overdue ? `Overdue since ${formatDateShort(goal.targetDate)}` : `Target: ${formatDateShort(goal.targetDate)} (${daysLeft}d)`}
          </span>
        )}
        {total > 0 && (
          <span>
            {done}/{total} milestones
          </span>
        )}
      </div>

      {(total > 0 || goal.achieved) && <ProgressBar pct={pct} gold={goal.achieved} />}

      {!compact && (
        <>
          {total > 0 && (
            <div className="milestone-list">
              {goal.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`milestone-row${m.done ? ' done' : ''}`}
                  onClick={() => onToggleMilestone?.(m.id)}
                >
                  <span className={`mini-check${m.done ? ' done' : ''}`}>✓</span>
                  <span className="mtext">{m.title}</span>
                </div>
              ))}
            </div>
          )}
          {onAddMilestone && !goal.achieved && (
            <form
              className="inline-add-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (newMilestone.trim()) {
                  onAddMilestone(newMilestone.trim());
                  setNewMilestone('');
                }
              }}
            >
              <input
                type="text"
                placeholder="Add a milestone/step…"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
              />
              <button className="btn btn-secondary btn-sm" type="submit">
                Add
              </button>
            </form>
          )}

          <div className="row-menu">
            {onSetAchieved && (
              <button
                className={`btn btn-sm ${goal.achieved ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => onSetAchieved(!goal.achieved)}
              >
                {goal.achieved ? 'Unmark achieved' : 'Mark achieved 🎉'}
              </button>
            )}
            {onEdit && (
              <button className="btn btn-secondary btn-sm" onClick={onEdit}>
                Edit
              </button>
            )}
            {onArchiveToggle && (
              <button className="btn btn-secondary btn-sm" onClick={onArchiveToggle}>
                {goal.archived ? 'Unarchive' : 'Archive'}
              </button>
            )}
            {onDelete && (
              <button className="btn btn-danger-outline btn-sm" onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
