import { Button } from '@fade/ui';
import type { RetentionEngine } from '@fade/domain-shared';
import type { InactiveClient } from './retention-data';

export type WinBackOffer = ReturnType<RetentionEngine['calculateWinBackOffer']>;

export default function WinBackCard({
  client,
  offer,
  onClose,
  onSend,
}: {
  client: InactiveClient;
  offer: WinBackOffer;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-card p-6 shadow-xl space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <span className="bg-semantic-warning/20 text-semantic-warning text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Win-Back Кампанія · Рівень: {offer.tier}
          </span>
          <h3 className="text-xl font-bold mt-2">Реактивація для {client.name}</h3>
          <p className="text-fg-secondary text-sm mt-1">
            Клієнт не відвідував салон {offer.inactivityDays} днів. Розраховано оптимізовану
            пропозицію за критеріями RetentionEngine.
          </p>
        </div>
        <button onClick={onClose} className="text-fg-muted hover:text-white text-sm font-semibold">
          ✕ Закрити
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/10 p-4 rounded-card backdrop-blur-sm">
        <div>
          <p className="text-xs text-fg-secondary">Знижка</p>
          <p className="text-2xl font-bold text-semantic-warning">{offer.discountPercentage}%</p>
        </div>
        <div>
          <p className="text-xs text-fg-secondary">Промокод</p>
          <p className="text-xl font-mono font-bold text-white">{offer.promoCode}</p>
        </div>
        <div>
          <p className="text-xs text-fg-secondary">Бонусний подарунок</p>
          <p className="text-sm font-medium text-white">
            {offer.bonusPerk || 'Стандартний догляд'}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/10">
          Скасувати
        </Button>
        <Button
          variant="primary"
          onClick={onSend}
          className="bg-semantic-warning hover:bg-interactive-hover text-fg font-bold"
        >
          Надіслати пропозицію (SMS / Push)
        </Button>
      </div>
    </div>
  );
}
