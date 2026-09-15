import { useState } from 'react';
import { useStore } from '../store';
import { RewardFormSheet } from '../components/RewardFormSheet';
import { ProgressBar } from '../components/ProgressBar';
import { availablePoints } from '../utils/points';
import type { Reward } from '../types';

function RewardRow({
  reward,
  available,
  onClaim,
  onUnclaim,
  onEdit,
  onDelete,
}: {
  reward: Reward;
  available: number;
  onClaim: () => void;
  onUnclaim: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const canAfford = available >= reward.cost;
  const pct = reward.claimed ? 100 : (available / reward.cost) * 100;

  return (
    <div className="card">
      <div className="reward-row" onClick={() => setMenuOpen((v) => !v)} style={{ cursor: 'pointer' }}>
        <span className="reward-emoji">{reward.emoji}</span>
        <div className="reward-main">
          <div className="reward-title">{reward.title}</div>
          <div className="reward-cost">🪙 {reward.cost} pts</div>
          {!reward.claimed && <ProgressBar pct={pct} gold />}
        </div>
        {reward.claimed ? (
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onUnclaim();
            }}
          >
            Claimed ↺
          </button>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            disabled={!canAfford}
            onClick={(e) => {
              e.stopPropagation();
              onClaim();
            }}
          >
            {canAfford ? 'Claim' : `Need ${reward.cost - available}`}
          </button>
        )}
      </div>
      {menuOpen && (
        <div className="row-menu">
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            Edit
          </button>
          <button
            className="btn btn-danger-outline btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function RewardsScreen() {
  const { state, addReward, updateReward, deleteReward, claimReward, unclaimReward } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);

  const available = availablePoints(state);
  const unclaimed = state.rewards.filter((r) => !r.claimed).sort((a, b) => a.cost - b.cost);
  const claimed = state.rewards.filter((r) => r.claimed);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(r: Reward) {
    setEditing(r);
    setFormOpen(true);
  }

  function handleSave(input: { title: string; emoji: string; cost: number }) {
    if (editing) {
      updateReward(editing.id, input);
    } else {
      addReward(input);
    }
    setFormOpen(false);
  }

  function handleDelete(r: Reward) {
    if (confirm(`Delete reward "${r.title}"?`)) {
      deleteReward(r.id);
    }
  }

  return (
    <main className="screen">
      <div className="header-row">
        <div>
          <h1 className="screen-title">Rewards</h1>
          <p className="screen-subtitle">Treat yourself for showing up</p>
        </div>
        <button className="fab" onClick={openNew} aria-label="Add reward">
          +
        </button>
      </div>

      <div className="hero-points card">
        <div className="num">🪙 {available}</div>
        <div className="label">points available to spend</div>
      </div>

      {unclaimed.length === 0 && claimed.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-emoji">🎁</div>
          <p>Add a small gift for yourself to unlock at a point level, like a coffee treat or a movie night.</p>
          <button className="btn btn-primary" onClick={openNew}>
            Add a reward
          </button>
        </div>
      ) : (
        <>
          {unclaimed.length > 0 && (
            <section>
              <div className="section-heading">
                <h2>Up next</h2>
              </div>
              <div className="card-list">
                {unclaimed.map((r) => (
                  <RewardRow
                    key={r.id}
                    reward={r}
                    available={available}
                    onClaim={() => claimReward(r.id)}
                    onUnclaim={() => unclaimReward(r.id)}
                    onEdit={() => openEdit(r)}
                    onDelete={() => handleDelete(r)}
                  />
                ))}
              </div>
            </section>
          )}

          {claimed.length > 0 && (
            <section>
              <div className="section-heading">
                <h2>Claimed</h2>
              </div>
              <div className="card-list">
                {claimed.map((r) => (
                  <RewardRow
                    key={r.id}
                    reward={r}
                    available={available}
                    onClaim={() => claimReward(r.id)}
                    onUnclaim={() => unclaimReward(r.id)}
                    onEdit={() => openEdit(r)}
                    onDelete={() => handleDelete(r)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {formOpen && (
        <RewardFormSheet reward={editing ?? undefined} onSave={handleSave} onClose={() => setFormOpen(false)} />
      )}
    </main>
  );
}
