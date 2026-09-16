import { useState } from 'react';
import { useStore } from '../store';
import { HabitFormSheet } from '../components/HabitFormSheet';
import { HabitListRow } from '../components/HabitListRow';
import type { Habit, Subtask } from '../types';

export function HabitsScreen() {
  const { state, addHabit, updateHabit, archiveHabit, deleteHabit } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const active = state.habits.filter((h) => !h.archived);
  const archived = state.habits.filter((h) => h.archived);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(h: Habit) {
    setEditing(h);
    setFormOpen(true);
  }

  function handleSave(input: {
    title: string;
    emoji: string;
    frequency: Habit['frequency'];
    points: number;
    subtasks: Subtask[];
  }) {
    if (editing) {
      updateHabit(editing.id, input);
    } else {
      addHabit(input);
    }
    setFormOpen(false);
  }

  function handleDelete(h: Habit) {
    if (confirm(`Delete "${h.title}"? This removes its history too.`)) {
      deleteHabit(h.id);
    }
  }

  return (
    <main className="screen">
      <div className="header-row">
        <div>
          <h1 className="screen-title">Habits</h1>
          <p className="screen-subtitle">Short-term, recurring routines</p>
        </div>
        <button className="fab" onClick={openNew} aria-label="Add habit">
          +
        </button>
      </div>

      {active.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-emoji">🔁</div>
          <p>Add a good habit like exercise, reading, or drinking water.</p>
          <button className="btn btn-primary" onClick={openNew}>
            Add a habit
          </button>
        </div>
      ) : (
        <div className="card-list">
          {active.map((h) => (
            <HabitListRow
              key={h.id}
              habit={h}
              completions={state.completions}
              onEdit={() => openEdit(h)}
              onArchiveToggle={() => archiveHabit(h.id, true)}
              onDelete={() => handleDelete(h)}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <section>
          <div className="section-heading">
            <h2>Archived</h2>
            <button className="link-btn" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Hide' : `Show (${archived.length})`}
            </button>
          </div>
          {showArchived && (
            <div className="card-list">
              {archived.map((h) => (
                <HabitListRow
                  key={h.id}
                  habit={h}
                  completions={state.completions}
                  onEdit={() => openEdit(h)}
                  onArchiveToggle={() => archiveHabit(h.id, false)}
                  onDelete={() => handleDelete(h)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {formOpen && (
        <HabitFormSheet habit={editing ?? undefined} onSave={handleSave} onClose={() => setFormOpen(false)} />
      )}
    </main>
  );
}
