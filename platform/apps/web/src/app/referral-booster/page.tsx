'use client';

import { useState } from 'react';
import { Badge, AlertBanner } from '@fade/ui';
import {
  INITIAL_TIERS,
  REFERRAL_CODE,
  SHARE_URL,
  type MilestoneTier,
} from './referral-booster-data';
import { ReferralShareCard } from './ReferralShareCard';
import { ReferralTierCard } from './ReferralTierCard';
import { ReferralSimulator } from './ReferralSimulator';

export default function ReferralBoosterPage() {
  const [referralCount, setReferralCount] = useState<number>(2);
  const [copied, setCopied] = useState<boolean>(false);
  const [tiers, setTiers] = useState<MilestoneTier[]>(INITIAL_TIERS);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleClaim = (tierId: string) => {
    setTiers((prev) => prev.map((t) => (t.id === tierId ? { ...t, claimed: true } : t)));
    const tier = tiers.find((t) => t.id === tierId);
    if (tier) {
      setSuccessMessage(
        `Успішно активовано бонус "${tier.name}": +${tier.bonusUAH} ₴ на ваш рахунок!`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Badge tone="accent" className="w-max">
          Retention & Growth Specialist
        </Badge>
        <h1 className="font-display text-3xl font-bold">Referral Booster & VIP Tiers</h1>
        <p className="text-body text-fg-secondary">
          Запрошуйте друзів до FADE та відкривайте ексклюзивні рівні нагороди. Чим більше друзів
          відвідують барбершоп, тим більші бонуси та привілеї ви отримуєте.
        </p>
      </header>

      {successMessage && (
        <AlertBanner tone="success" title="Вітаємо!">
          {successMessage}
        </AlertBanner>
      )}

      <ReferralShareCard
        referralCode={REFERRAL_CODE}
        shareUrl={SHARE_URL}
        copied={copied}
        onCopy={() => void handleCopy()}
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Рівні нагород та прогрес</h2>
          <span className="text-body font-medium text-fg-secondary">
            Запрошено друзів: <strong className="text-fg">{referralCount}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <ReferralTierCard
              key={tier.id}
              tier={tier}
              unlocked={referralCount >= tier.requiredReferrals}
              onClaim={handleClaim}
            />
          ))}
        </div>
      </div>

      <ReferralSimulator referralCount={referralCount} onChange={setReferralCount} />
    </div>
  );
}
