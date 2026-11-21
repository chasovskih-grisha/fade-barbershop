import { Badge, Card } from '@fade/ui';
import type { ReferralItem } from './useReferralPage';

const STATUS_LABEL: Record<'pending' | 'rewarded', { label: string; tone: 'warning' | 'success' }> =
  {
    pending: { label: 'Очікує візиту друга', tone: 'warning' },
    rewarded: { label: 'Бонус нараховано (+150 ₴)', tone: 'success' },
  };

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium' }).format(new Date(iso));
}

interface ReferralListProps {
  referrals: ReferralItem[];
}

export function ReferralList({ referrals }: ReferralListProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-h4">Статус запрошених друзів</h2>
      {referrals.length === 0 ? (
        <Card className="p-8 text-center text-fg-secondary">
          У вас поки немає запрошених друзів. Поділіться посиланням вище!
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {referrals.map((ref) => {
            const meta = STATUS_LABEL[ref.status];
            return (
              <li key={ref.id}>
                <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4">
                  <div className="flex flex-col">
                    <span className="text-body font-medium text-fg">{ref.maskedName}</span>
                    <span className="text-caption text-fg-secondary">
                      Створено: {formatDate(ref.createdAt)}
                    </span>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
