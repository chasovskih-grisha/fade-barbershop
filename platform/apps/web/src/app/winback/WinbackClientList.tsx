import { Badge, Card } from '@fade/ui';
import type { ClientProfile } from './winback-campaign';

interface WinbackClientListProps {
  clients: ClientProfile[];
  selectedClientId: string;
  onSelect: (client: ClientProfile) => void;
}

export function WinbackClientList({ clients, selectedClientId, onSelect }: WinbackClientListProps) {
  return (
    <Card className="p-6 flex flex-col gap-4 md:col-span-1">
      <h2 className="font-display text-xl font-semibold">База клієнтів (Ризик відтоку)</h2>
      <div className="flex flex-col gap-2">
        {clients.map((cli) => (
          <button
            key={cli.clientId}
            onClick={() => onSelect(cli)}
            className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-colors ${
              selectedClientId === cli.clientId
                ? 'border-accent bg-surface-hover font-medium'
                : 'border-line bg-surface hover:bg-surface-muted'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-fg font-semibold">{cli.name}</span>
              <Badge tone={cli.lastVisitDaysAgo > 60 ? 'warning' : 'accent'}>
                {cli.lastVisitDaysAgo} дн. тому
              </Badge>
            </div>
            <span className="text-caption text-fg-secondary">
              Візитів: {cli.totalVisits} | Витрачено: {cli.totalSpent} ₴
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
