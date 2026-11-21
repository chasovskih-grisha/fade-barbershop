import { Badge, Button, Card } from '@fade/ui';
import type { Campaign, ClientProfile } from './winback-campaign';

interface WinbackCampaignCardProps {
  client: ClientProfile;
  campaign: Campaign;
  onLaunch: () => void;
  onReactivate: () => void;
}

export function WinbackCampaignCard({
  client,
  campaign,
  onLaunch,
  onReactivate,
}: WinbackCampaignCardProps) {
  return (
    <Card className="p-6 flex flex-col justify-between gap-6 md:col-span-2">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <span className="text-caption uppercase text-fg-secondary tracking-wider">
              Обраний клієнт
            </span>
            <h3 className="font-display text-2xl font-bold text-fg mt-1">{client.name}</h3>
          </div>
          <Badge
            tone={
              campaign.urgency === 'critical'
                ? 'danger'
                : (campaign.urgency as 'warning' | 'accent' | 'success')
            }
          >
            {campaign.tier}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-surface-sunken border border-line flex flex-col gap-1">
            <span className="text-caption text-fg-secondary">Знижка реактивації</span>
            <span className="font-display text-2xl font-bold text-accent">
              -{campaign.discount}%
            </span>
          </div>
          <div className="p-4 rounded-lg bg-surface-sunken border border-line flex flex-col gap-1">
            <span className="text-caption text-fg-secondary">Промокод</span>
            <span className="font-display text-h4 font-mono font-bold text-fg">
              {campaign.promo}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface-sunken border border-line flex flex-col gap-1">
          <span className="text-caption text-fg-secondary">Бонусний сервіс / Подарунок</span>
          <span className="text-body font-medium text-fg">{campaign.bonus}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-line">
        <Button className="w-full sm:w-auto flex-1" onClick={onLaunch}>
          Запустити Win-Back кампанію (SMS / Push)
        </Button>
        <Button variant="secondary" className="w-full sm:w-auto" onClick={onReactivate}>
          Позначити як реактивованого
        </Button>
      </div>
    </Card>
  );
}
