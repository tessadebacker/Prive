export function ProgressBar({ pct, gold = false }: { pct: number; gold?: boolean }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="progress-track">
      <div className={`progress-fill${gold ? ' gold' : ''}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
