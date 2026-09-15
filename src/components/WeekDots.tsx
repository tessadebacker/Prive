import { addDays, todayISO, weekdayOf } from '../utils/date';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function WeekDots({ dates }: { dates: Set<string> }) {
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  return (
    <div className="week-overview">
      {days.map((d) => (
        <div key={d} className="week-overview-day">
          <span className={`week-dot${dates.has(d) ? ' filled' : ''}${d === today ? ' today' : ''}`} />
          <span className="week-overview-label">{DAY_LETTERS[weekdayOf(d)]}</span>
        </div>
      ))}
    </div>
  );
}
