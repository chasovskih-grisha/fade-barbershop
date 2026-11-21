import { Badge, Button, Card } from '@fade/ui';

interface ReferralShareCardProps {
  code: string;
  shareUrl: string;
  monthlyUsed: number;
  monthlyLimit: number;
  copied: boolean;
  onCopyCode: () => void;
  onCopyLink: () => void;
  onShareNative: () => void;
}

export function ReferralShareCard({
  code,
  shareUrl,
  monthlyUsed,
  monthlyLimit,
  copied,
  onCopyCode,
  onCopyLink,
  onShareNative,
}: ReferralShareCardProps) {
  const remainingSlots = Math.max(0, monthlyLimit - monthlyUsed);

  return (
    <Card className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-caption text-fg-secondary uppercase tracking-wider">
            Ваш реферальний код
          </span>
          <div className="font-display text-h4 font-bold tracking-wider mt-1">{code}</div>
        </div>
        <Button variant="secondary" onClick={onCopyCode}>
          {copied ? 'Скопійовано!' : 'Скопіювати код'}
        </Button>
      </div>

      <div className="border-t border-line pt-4 flex flex-col gap-3">
        <span className="text-caption text-fg-secondary">Посилання для запрошення</span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-fg select-all"
          />
          <Button onClick={onCopyLink}>Копіювати</Button>
          <Button variant="secondary" onClick={onShareNative}>
            Поділитись
          </Button>
        </div>
      </div>

      <div className="border-t border-line pt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-body font-medium">Місячний ліміт запрошень</span>
          <span className="text-caption text-fg-secondary">
            Використано {monthlyUsed} з {monthlyLimit} за цей місяць
          </span>
        </div>
        <Badge tone={remainingSlots > 0 ? 'accent' : 'warning'}>
          Залишилось місць: {remainingSlots}
        </Badge>
      </div>
    </Card>
  );
}
