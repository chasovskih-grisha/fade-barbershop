import { Badge, Button, Card } from '@fade/ui';
import type { MilestoneTier } from './referral-booster-data';

interface ReferralTierCardProps {
  tier: MilestoneTier;
  unlocked: boolean;
  onClaim: (tierId: string) => void;
}

export function ReferralTierCard({ tier, unlocked, onClaim }: ReferralTierCardProps) {
  return (
    <Card
      className={`p-6 flex flex-col justify-between gap-4 border-2 ${
        unlocked ? 'border-accent/40 bg-surface' : 'border-line opacity-80'
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-h4">{tier.name}</span>
          <Badge tone={unlocked ? 'success' : 'warning'}>{tier.requiredReferrals} друзів</Badge>
        </div>
        <p className="text-body-s text-fg-secondary">{tier.rewardDescription}</p>
      </div>

      <div>
        {tier.claimed ? (
          <Badge tone="success" className="w-full justify-center py-2">
            Отримано
          </Badge>
        ) : unlocked ? (
          <Button className="w-full" onClick={() => onClaim(tier.id)}>
            Отримати бонус
          </Button>
        ) : (
          <Button variant="secondary" disabled className="w-full opacity-50">
            Ще не досягнуто
          </Button>
        )}
      </div>
    </Card>
  );
}
