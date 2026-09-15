import { useState } from 'react';
import { Sheet } from './Sheet';
import type { Goal } from '../types';
import { GOAL_EMOJIS } from '../types';

export function GoalFormSheet({
  goal,
  onSave,
  onClose,
}: {
  goal?: Goal;
  onSave: (input: {
    title: string;
    emoji: string;
    description: string;
    targetDate: string | null;
    points: number;
    dailyPoints: number;
  }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(goal?.title ?? '');
  const [emoji, setEmoji] = useState(goal?.emoji ?? GOAL_EMOJIS[0]);
  const [description, setDescription] = useState(goal?.description ?? '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '');
  const [points, setPoints] = useState(goal?.points ?? 100);
  const [dailyPoints, setDailyPoints] = useState(goal?.dailyPoints ?? 5);

  const canSave = title.trim().length > 0;

  return (
    <Sheet title={goal ? 'Edit goal' : 'New goal'} onClose={onClose}>
      <div className="field">
        <label>Name</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Get my boat licence"
          autoFocus
        />
      </div>

      <div className="field">
        <label>Icon</label>
        <div className="emoji-grid">
          {GOAL_EMOJIS.map((e) => (
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
        <label>Notes (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any details about this goal…"
        />
      </div>

      <div className="field">
        <label>Target date (optional)</label>
        <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </div>

      <div className="field">
        <label>Points for working on it each day</label>
        <div className="stepper">
          <button type="button" onClick={() => setDailyPoints((n) => Math.max(0, n - 5))}>
            −
          </button>
          <span className="stepper-value">{dailyPoints}</span>
          <button type="button" onClick={() => setDailyPoints((n) => Math.min(100, n + 5))}>
            +
          </button>
        </div>
      </div>

      <div className="field">
        <label>Points on achievement</label>
        <div className="stepper">
          <button type="button" onClick={() => setPoints((n) => Math.max(10, n - 25))}>
            −
          </button>
          <span className="stepper-value">{points}</span>
          <button type="button" onClick={() => setPoints((n) => Math.min(1000, n + 25))}>
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
          onClick={() =>
            onSave({
              title: title.trim(),
              emoji,
              description: description.trim(),
              targetDate: targetDate || null,
              points,
              dailyPoints,
            })
          }
        >
          Save
        </button>
      </div>
    </Sheet>
  );
}
