export type Tab = 'today' | 'habits' | 'goals' | 'rewards';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '✅' },
  { id: 'habits', label: 'Habits', icon: '🔁' },
  { id: 'goals', label: 'Goals', icon: '🚩' },
  { id: 'rewards', label: 'Rewards', icon: '🎁' },
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`nav-btn${active === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
