import { Button, Card } from '@fade/ui';

interface ReferralShareCardProps {
  referralCode: string;
  shareUrl: string;
  copied: boolean;
  onCopy: () => void;
}

export function ReferralShareCard({
  referralCode,
  shareUrl,
  copied,
  onCopy,
}: ReferralShareCardProps) {
  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-caption uppercase text-fg-secondary tracking-wider">
            Ваш персональний код
          </span>
          <div className="font-display text-2xl font-bold mt-1 text-accent">{referralCode}</div>
        </div>
        <Button onClick={onCopy}>
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
  );
}
