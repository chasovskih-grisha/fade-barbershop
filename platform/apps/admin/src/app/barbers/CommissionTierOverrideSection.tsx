'use client';

import { useState } from 'react';
import { Button } from '@fade/ui';

export interface CommissionTierOverrideProps {
  barberId: string;
  currentTier: 'standard' | 'bronze' | 'silver' | 'gold';
  bonusMultiplier: number;
  onSaveTier: (tier: 'standard' | 'bronze' | 'silver' | 'gold', multiplier: number) => Promise<boolean>;
  saving?: boolean;
}

const TIERS: Array<{ value: 'standard' | 'bronze' | 'silver' | 'gold'; label: string; defaultMult: number }> = [
  { value: 'standard', label: 'Стандарт (Standard - 45%)', defaultMult: 1.0 },
  { value: 'bronze', label: 'Бронза (Bronze - 50%)', defaultMult: 1.05 },
  { value: 'silver', label: 'Срібло (Silver - 55%)', defaultMult: 1.10 },
  { value: 'gold', label: 'Золото (Gold - 60%)', defaultMult: 1.20 },
];

export default function CommissionTierOverrideSection({
  barberId: _barberId,
  currentTier,
  bonusMultiplier,
  onSaveTier,
  saving,
}: CommissionTierOverrideProps) {
  const [tier, setTier] = useState<'standard' | 'bronze' | 'silver' | 'gold'>(currentTier || 'standard');
  const [multiplier, setMultiplier] = useState<string>(String(bonusMultiplier || 1.0));
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleTierChange = (newTier: 'standard' | 'bronze' | 'silver' | 'gold') => {
    setTier(newTier);
    const found = TIERS.find((t) => t.value === newTier);
    if (found) {
      setMultiplier(String(found.defaultMult));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const multNum = parseFloat(multiplier);
    if (isNaN(multNum) || multNum < 0.5 || multNum > 2.5) {
      setErrorMsg('Множник комісії має бути від 0.5 до 2.5');
      return;
    }

    const ok = await onSaveTier(tier, multNum);
    if (ok) {
      setSuccessMsg('Рівень комісії та бонуси успішно оновлено');
    } else {
      setErrorMsg('Не вдалося зберегти рівень комісії');
    }
  };

  return (
    <div className="rounded-card border border-line p-4 space-y-4 bg-surface-base">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display text-h5 font-bold">Керування комісією та бонусами</h4>
          <p className="text-caption text-fg-muted">Перевизначення рівня виплат та бонусного множника для барбера</p>
        </div>
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold bg-interactive text-fg uppercase">
          {tier} (×{multiplier})
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-caption">
            Рівень комісії (Tier)
            <select
              aria-label="Рівень комісії"
              value={tier}
              onChange={(e) => handleTierChange(e.target.value as 'standard' | 'bronze' | 'silver' | 'gold')}
              className="mt-1 w-full rounded-input border border-line bg-surface-raised p-2 text-body text-fg"
            >
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-caption">
            Бонусний множник (Multiplier)
            <input
              type="number"
              step="0.01"
              min="0.5"
              max="2.5"
              aria-label="Бонусний множник"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              className="mt-1 w-full rounded-input border border-line bg-surface-raised p-2 text-body text-fg"
            />
          </label>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button variant="secondary" size="md" type="submit" disabled={saving}>
            {saving ? 'Збереження...' : 'Зберегти рівень комісії'}
          </Button>
          {successMsg && <span className="text-semantic-success text-caption font-medium">{successMsg}</span>}
          {errorMsg && <span role="alert" className="text-semantic-danger text-caption font-medium">{errorMsg}</span>}
        </div>
      </form>
    </div>
  );
}
