'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@fade/ui';
import { TIERS, type CommissionTier } from './commission-tiers';
import CommissionTierFields from './commission-tier-fields';
import CommissionTierStatus from './commission-tier-status';

export interface CommissionTierOverrideProps {
  barberId: string;
  currentTier: CommissionTier;
  bonusMultiplier: number;
  onSaveTier: (tier: CommissionTier, multiplier: number) => Promise<boolean>;
  saving?: boolean;
}

export default function CommissionTierOverrideSection({
  barberId: _barberId,
  currentTier,
  bonusMultiplier,
  onSaveTier,
  saving,
}: CommissionTierOverrideProps) {
  const [tier, setTier] = useState<CommissionTier>(currentTier || 'standard');
  const [multiplier, setMultiplier] = useState<string>(String(bonusMultiplier || 1.0));
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleTierChange = (newTier: CommissionTier) => {
    setTier(newTier);
    const found = TIERS.find((item) => item.value === newTier);
    if (found) setMultiplier(String(found.defaultMult));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const multNum = parseFloat(multiplier);
    if (isNaN(multNum) || multNum < 0.5 || multNum > 2.5) {
      setErrorMsg('Множник комісії має бути від 0.5 до 2.5');
      return;
    }

    const ok = await onSaveTier(tier, multNum);
    if (ok) setSuccessMsg('Рівень комісії та бонуси успішно оновлено');
    else setErrorMsg('Не вдалося зберегти рівень комісії');
  };

  return (
    <div className="rounded-card border border-line p-4 space-y-4 bg-surface-base">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display text-h5 font-bold">Керування комісією та бонусами</h4>
          <p className="text-caption text-fg-muted">
            Перевизначення рівня виплат та бонусного множника для барбера
          </p>
        </div>
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold bg-interactive text-fg uppercase">
          {tier} (×{multiplier})
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <CommissionTierFields
          tier={tier}
          multiplier={multiplier}
          onTierChange={handleTierChange}
          onMultiplierChange={setMultiplier}
        />
        <div className="flex items-center gap-3 pt-1">
          <Button variant="secondary" size="md" type="submit" disabled={saving}>
            {saving ? 'Збереження...' : 'Зберегти рівень комісії'}
          </Button>
          <CommissionTierStatus successMsg={successMsg} errorMsg={errorMsg} />
        </div>
      </form>
    </div>
  );
}
