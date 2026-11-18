'use client';

import { useState } from 'react';
import { Card, Button, Badge, AlertBanner } from '@fade/ui';

interface MilestoneTier {
  id: string;
  name: string;
  requiredReferrals: number;
  rewardDescription: string;
  bonusUAH: number;
  claimed: boolean;
}

export default function ReferralBoosterPage() {
  const [referralCount, setReferralCount] = useState<number>(2);
  const [copied, setCopied] = useState<boolean>(false);
  const [tiers, setTiers] = useState<MilestoneTier[]>([
    { id: 'bronze', name: 'Bronze Booster', requiredReferrals: 1, rewardDescription: '150 ₴ bonus + Priority Booking', bonusUAH: 150, claimed: true },
    { id: 'silver', name: 'Silver Executive', requiredReferrals: 3, rewardDescription: '500 ₴ bonus + Free Beard Trim', bonusUAH: 500, claimed: false },
    { id: 'gold', name: 'Gold Mastermind', requiredReferrals: 5, rewardDescription: '1200 ₴ bonus + Free Haircut + VIP Concierge', bonusUAH: 1200, claimed: false },
  ]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const referralCode = 'FADE-VIP-2026';
  const shareUrl = `https://fade.barbershop/invite/${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleClaim = (tierId: string) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, claimed: true } : t))
    );
    const tier = tiers.find((t) => t.id === tierId);
    if (tier) {
      setSuccessMessage(`Успішно активовано бонус "${tier.name}": +${tier.bonusUAH} ₴ на ваш рахунок!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Badge tone="accent" className="w-max">Retention & Growth Specialist</Badge>
        <h1 className="font-display text-3xl font-bold">Referral Booster & VIP Tiers</h1>
        <p className="text-body text-fg-secondary">
          Запрошуйте друзів до FADE та відкривайте ексклюзивні рівні нагороди. Чим більше друзів відвідують барбершоп, тим більші бонуси та привілеї ви отримуєте.
        </p>
      </header>

      {successMessage && (
        <AlertBanner tone="success" title="Вітаємо!">
          {successMessage}
        </AlertBanner>
      )}

      {/* Share Section */}
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-caption uppercase text-fg-secondary tracking-wider">Ваш персональний код</span>
            <div className="font-display text-2xl font-bold mt-1 text-accent">{referralCode}</div>
          </div>
          <Button onClick={() => void handleCopy()}>
            {copied ? 'Посилання скопійовано!' : 'Копіювати посилання'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-fg"
          />
        </div>
      </Card>

      {/* Progress & Tiers */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Рівні нагород та прогрес</h2>
          <span className="text-body font-medium text-fg-secondary">Запрошено друзів: <strong className="text-fg">{referralCount}</strong></span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {tiers.map((tier) => {
            const unlocked = referralCount >= tier.requiredReferrals;
            return (
              <Card key={tier.id} className={`p-6 flex flex-col justify-between gap-4 border-2 ${unlocked ? 'border-accent/40 bg-surface' : 'border-line opacity-80'}`}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-h4">{tier.name}</span>
                    <Badge tone={unlocked ? 'success' : 'warning'}>
                      {tier.requiredReferrals} друзів
                    </Badge>
                  </div>
                  <p className="text-body-s text-fg-secondary">{tier.rewardDescription}</p>
                </div>

                <div>
                  {tier.claimed ? (
                    <Badge tone="success" className="w-full justify-center py-2">Отримано</Badge>
                  ) : unlocked ? (
                    <Button className="w-full" onClick={() => handleClaim(tier.id)}>Отримати бонус</Button>
                  ) : (
                    <Button variant="secondary" disabled className="w-full opacity-50">Ще не досягнуто</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Simulation Control for testing / Demo */}
      <Card className="p-6 flex flex-col gap-3 bg-surface-sunken">
        <h3 className="font-display text-h4 font-medium">Симулятор рефералів (для тестування)</h3>
        <p className="text-caption text-fg-secondary">Змініть кількість успішних запрошень друзів для перевірки розблокування рівнів:</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setReferralCount(Math.max(0, referralCount - 1))}
            className="px-4 py-2 rounded border border-line bg-surface font-medium hover:bg-surface-hover"
          >
            - Зменшити
          </button>
          <span className="font-display text-xl font-bold">{referralCount}</span>
          <button
            onClick={() => setReferralCount(referralCount + 1)}
            className="px-4 py-2 rounded border border-line bg-surface font-medium hover:bg-surface-hover"
          >
            + Збільшити
          </button>
        </div>
      </Card>
    </div>
  );
}
