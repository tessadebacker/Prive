import { useStore } from '../store';
import { availablePoints, levelFor, totalPointsEarned } from '../utils/points';
import { ProgressBar } from './ProgressBar';

export function Header() {
  const { state } = useStore();
  const total = totalPointsEarned(state);
  const available = availablePoints(state);
  const { level, intoLevel, toNext } = levelFor(total);

  return (
    <header className="top-header">
      <div className="header-row">
        <div className="brand">
          <span>🎯</span>
          <span>Aim</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="points-pill" title="Points available to spend on rewards">
            🪙 {available}
          </div>
          <div className="level-pill" title={`${toNext} points to level ${level + 1}`}>
            ⭐ Lv {level}
          </div>
        </div>
      </div>
      <ProgressBar pct={(intoLevel / 100) * 100} />
    </header>
  );
}
