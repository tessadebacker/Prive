import { useState } from 'react';
import { useStore } from '../store';
import { GoalCard } from '../components/GoalCard';
import { GoalFormSheet } from '../components/GoalFormSheet';
import type { Goal } from '../types';
import { todayISO } from '../utils/date';
import { goalCheckInDatesFor, goalCurrentStreak } from '../utils/goal';

export function GoalsScreen() {
  const {
    state,
    addGoal,
    updateGoal,
    archiveGoal,
    deleteGoal,
    toggleMilestone,
    addMilestone,
    setAchieved,
    toggleGoalCheckIn,
  } = useStore();
  const today = todayISO();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const active = state.goals.filter((g) => !g.archived && !g.achieved);
  const achieved = state.goals.filter((g) => !g.archived && g.achieved);
  const archived = state.goals.filter((g) => g.archived);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(g: Goal) {
    setEditing(g);
    setFormOpen(true);
  }

  function handleSave(input: {
    title: string;
    emoji: string;
    description: string;
    targetDate: string | null;
    points: number;
    dailyPoints: number;
  }) {
    if (editing) {
      updateGoal(editing.id, input);
    } else {
      addGoal(input);
    }
    setFormOpen(false);
  }

  function handleDelete(g: Goal) {
    if (confirm(`Delete "${g.title}"? This can't be undone.`)) {
      deleteGoal(g.id);
    }
  }

  function renderCard(g: Goal) {
    const canCheckIn = !g.achieved && !g.archived;
    const checkInDates = goalCheckInDatesFor(g.id, state.goalCheckIns);
    return (
      <GoalCard
        key={g.id}
        goal={g}
        checkedToday={canCheckIn ? checkInDates.has(today) : undefined}
        streak={canCheckIn ? goalCurrentStreak(g, state.goalCheckIns) : undefined}
        checkInDates={checkInDates}
        onToggleCheckIn={canCheckIn ? () => toggleGoalCheckIn(g.id, today) : undefined}
        onToggleMilestone={(mid) => toggleMilestone(g.id, mid)}
        onAddMilestone={(title) => addMilestone(g.id, title)}
        onSetAchieved={(v) => setAchieved(g.id, v)}
        onEdit={() => openEdit(g)}
        onArchiveToggle={() => archiveGoal(g.id, !g.archived)}
        onDelete={() => handleDelete(g)}
      />
    );
  }

  return (
    <main className="screen">
      <div className="header-row">
        <div>
          <h1 className="screen-title">Goals</h1>
          <p className="screen-subtitle">Long-term achievements</p>
        </div>
        <button className="fab" onClick={openNew} aria-label="Add goal">
          +
        </button>
      </div>

      {active.length === 0 && achieved.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-emoji">🚩</div>
          <p>Set a big goal, like getting your boat licence, and break it into steps.</p>
          <button className="btn btn-primary" onClick={openNew}>
            Add a goal
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <div className="section-heading">
                <h2>In progress</h2>
              </div>
              <div className="card-list">{active.map(renderCard)}</div>
            </section>
          )}

          {achieved.length > 0 && (
            <section>
              <div className="section-heading">
                <h2>Achieved</h2>
              </div>
              <div className="card-list">{achieved.map(renderCard)}</div>
            </section>
          )}
        </>
      )}

      {archived.length > 0 && (
        <section>
          <div className="section-heading">
            <h2>Archived</h2>
            <button className="link-btn" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Hide' : `Show (${archived.length})`}
            </button>
          </div>
          {showArchived && <div className="card-list">{archived.map(renderCard)}</div>}
        </section>
      )}

      {formOpen && (
        <GoalFormSheet goal={editing ?? undefined} onSave={handleSave} onClose={() => setFormOpen(false)} />
      )}
    </main>
  );
}
