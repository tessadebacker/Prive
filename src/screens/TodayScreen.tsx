import { useStore } from '../store';
import { formatDateLong, todayISO } from '../utils/date';
import { isScheduledOn } from '../utils/habit';
import { TodayHabitRow } from '../components/TodayHabitRow';
import { GoalCard } from '../components/GoalCard';
import type { Tab } from '../components/BottomNav';

export function TodayScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { state, toggleCompletion } = useStore();
  const today = todayISO();

  const dueHabits = state.habits
    .filter((h) => !h.archived)
    .filter((h) => isScheduledOn(h.frequency, today));

  const activeGoals = state.goals.filter((g) => !g.archived && !g.achieved);

  return (
    <main className="screen">
      <div>
        <h1 className="screen-title">Today</h1>
        <p className="screen-subtitle">{formatDateLong(today)}</p>
      </div>

      <section>
        <div className="section-heading">
          <h2>Habits</h2>
          <button className="link-btn" onClick={() => onNavigate('habits')}>
            Manage
          </button>
        </div>
        {dueHabits.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-emoji">🌱</div>
            <p>No habits scheduled for today yet.</p>
            <button className="btn btn-primary" onClick={() => onNavigate('habits')}>
              Add a habit
            </button>
          </div>
        ) : (
          <div className="card-list">
            {dueHabits.map((h) => (
              <TodayHabitRow key={h.id} habit={h} completions={state.completions} onToggle={toggleCompletion} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="section-heading">
          <h2>Goals in progress</h2>
          <button className="link-btn" onClick={() => onNavigate('goals')}>
            Manage
          </button>
        </div>
        {activeGoals.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-emoji">🚩</div>
            <p>No long-term goals yet. Add one, like getting your boat licence.</p>
            <button className="btn btn-primary" onClick={() => onNavigate('goals')}>
              Add a goal
            </button>
          </div>
        ) : (
          <div className="card-list">
            {activeGoals.map((g) => (
              <GoalCard key={g.id} goal={g} compact onClick={() => onNavigate('goals')} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
