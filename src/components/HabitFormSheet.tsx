import { useState } from 'react';
import { Sheet } from './Sheet';
import type { Frequency, Habit } from '../types';
import { DAY_LABELS, HABIT_EMOJIS } from '../types';

type FreqKind = Frequency['kind'];

export function HabitFormSheet({
  habit,
  onSave,
  onClose,
}: {
  habit?: Habit;
  onSave: (input: { title: string; emoji: string; frequency: Frequency; points: number }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(habit?.title ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? HABIT_EMOJIS[0]);
  const [freqKind, setFreqKind] = useState<FreqKind>(habit?.frequency.kind ?? 'daily');
  const [timesPerWeek, setTimesPerWeek] = useState(
    habit?.frequency.kind === 'timesPerWeek' ? habit.frequency.count : 3
  );
  const [days, setDays] = useState<number[]>(
    habit?.frequency.kind === 'specificDays' ? habit.frequency.days : [1, 3, 5]
  );
  const [everyNMonths, setEveryNMonths] = useState(
    habit?.frequency.kind === 'everyNMonths' ? habit.frequency.months : 3
  );
  const [points, setPoints] = useState(habit?.points ?? 10);

  const canSave =
    title.trim().length > 0 && (freqKind !== 'specificDays' || days.length > 0);

  function buildFrequency(): Frequency {
    if (freqKind === 'daily') return { kind: 'daily' };
    if (freqKind === 'timesPerWeek') return { kind: 'timesPerWeek', count: timesPerWeek };
    if (freqKind === 'everyNMonths') return { kind: 'everyNMonths', months: everyNMonths };
    return { kind: 'specificDays', days: [...days].sort() };
  }

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  return (
    <Sheet title={habit ? 'Edit habit' : 'New habit'} onClose={onClose}>
      <div className="field">
        <label>Name</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Exercise"
          autoFocus
        />
      </div>

      <div className="field">
        <label>Icon</label>
        <div className="emoji-grid">
          {HABIT_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={`emoji-opt${emoji === e ? ' selected' : ''}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>How often</label>
        <div className="segmented">
          <button
            type="button"
            className={freqKind === 'daily' ? 'active' : ''}
            onClick={() => setFreqKind('daily')}
          >
            Every day
          </button>
          <button
            type="button"
            className={freqKind === 'timesPerWeek' ? 'active' : ''}
            onClick={() => setFreqKind('timesPerWeek')}
          >
            X / week
          </button>
          <button
            type="button"
            className={freqKind === 'specificDays' ? 'active' : ''}
            onClick={() => setFreqKind('specificDays')}
          >
            Specific days
          </button>
          <button
            type="button"
            className={freqKind === 'everyNMonths' ? 'active' : ''}
            onClick={() => setFreqKind('everyNMonths')}
          >
            Every X months
          </button>
        </div>
      </div>

      {freqKind === 'timesPerWeek' && (
        <div className="field">
          <label>Times per week</label>
          <div className="stepper">
            <button type="button" onClick={() => setTimesPerWeek((n) => Math.max(1, n - 1))}>
              −
            </button>
            <span className="stepper-value">{timesPerWeek}</span>
            <button type="button" onClick={() => setTimesPerWeek((n) => Math.min(7, n + 1))}>
              +
            </button>
          </div>
        </div>
      )}

      {freqKind === 'everyNMonths' && (
        <div className="field">
          <label>Every how many months</label>
          <div className="stepper">
            <button type="button" onClick={() => setEveryNMonths((n) => Math.max(1, n - 1))}>
              −
            </button>
            <span className="stepper-value">{everyNMonths}</span>
            <button type="button" onClick={() => setEveryNMonths((n) => Math.min(24, n + 1))}>
              +
            </button>
          </div>
        </div>
      )}

      {freqKind === 'specificDays' && (
        <div className="field">
          <label>Days</label>
          <div className="day-chips">
            {DAY_LABELS.map((label, idx) => (
              <button
                key={label}
                type="button"
                className={`day-chip${days.includes(idx) ? ' active' : ''}`}
                onClick={() => toggleDay(idx)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label>Points per completion</label>
        <div className="stepper">
          <button type="button" onClick={() => setPoints((n) => Math.max(1, n - 5))}>
            −
          </button>
          <span className="stepper-value">{points}</span>
          <button type="button" onClick={() => setPoints((n) => Math.min(100, n + 5))}>
            +
          </button>
        </div>
      </div>

      <div className="sheet-actions">
        <button className="btn btn-secondary btn-block" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-block"
          disabled={!canSave}
          onClick={() => onSave({ title: title.trim(), emoji, frequency: buildFrequency(), points })}
        >
          Save
        </button>
      </div>
    </Sheet>
  );
}
