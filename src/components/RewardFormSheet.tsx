import { useState } from 'react';
import { Sheet } from './Sheet';
import type { Reward } from '../types';
import { REWARD_EMOJIS } from '../types';

export function RewardFormSheet({
  reward,
  onSave,
  onClose,
}: {
  reward?: Reward;
  onSave: (input: { title: string; emoji: string; cost: number }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(reward?.title ?? '');
  const [emoji, setEmoji] = useState(reward?.emoji ?? REWARD_EMOJIS[0]);
  const [cost, setCost] = useState(reward?.cost ?? 50);

  const canSave = title.trim().length > 0 && cost > 0;

  return (
    <Sheet title={reward ? 'Edit reward' : 'New reward'} onClose={onClose}>
      <div className="field">
        <label>Reward</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Buy myself flowers"
          autoFocus
        />
      </div>

      <div className="field">
        <label>Icon</label>
        <div className="emoji-grid">
          {REWARD_EMOJIS.map((e) => (
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
        <label>Cost in points</label>
        <div className="stepper">
          <button type="button" onClick={() => setCost((n) => Math.max(5, n - 25))}>
            −
          </button>
          <span className="stepper-value">{cost}</span>
          <button type="button" onClick={() => setCost((n) => Math.min(5000, n + 25))}>
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
          onClick={() => onSave({ title: title.trim(), emoji, cost })}
        >
          Save
        </button>
      </div>
    </Sheet>
  );
}
