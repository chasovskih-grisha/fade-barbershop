import { Card } from '@fade/ui';
import type { ReferralData } from './useReferralPage';

interface ReferralStatsProps {
  data: ReferralData;
}

export function ReferralStats({ data }: ReferralStatsProps) {
  const successfulReferrals = data.referrals.filter((r) => r.status === 'rewarded').length;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="p-6 flex flex-col gap-1">
        <span className="text-caption text-fg-secondary">Зароблено бонусів</span>
        <span className="font-display text-h2 font-bold text-accent">{data.earnedPoints} ₴</span>
        <span className="text-caption text-fg-muted mt-1">
          Доступно для оплати послуг та товарів
        </span>
      </Card>
      <Card className="p-6 flex flex-col gap-1">
        <span className="text-caption text-fg-secondary">Успішних запрошень</span>
        <span className="font-display text-h2 font-bold">{successfulReferrals}</span>
        <span className="text-caption text-fg-muted mt-1">Друзів, які відвідали барбершоп</span>
      </Card>
    </div>
  );
}
