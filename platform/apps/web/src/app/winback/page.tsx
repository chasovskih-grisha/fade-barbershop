'use client';

import { useState } from 'react';
import { Card, Button, Badge, AlertBanner } from '@fade/ui';

interface ClientProfile {
  clientId: string;
  name: string;
  lastVisitDaysAgo: number;
  totalVisits: number;
  totalSpent: number;
}

export default function WinbackDashboardPage() {
  const [clients, setClients] = useState<ClientProfile[]>([
    { clientId: 'cli-001', name: 'Олександр Петренко', lastVisitDaysAgo: 72, totalVisits: 4, totalSpent: 2400 },
    { clientId: 'cli-002', name: 'Максим Коваленко', lastVisitDaysAgo: 38, totalVisits: 1, totalSpent: 650 },
    { clientId: 'cli-003', name: 'Андрій Шевченко', lastVisitDaysAgo: 105, totalVisits: 12, totalSpent: 9800 },
    { clientId: 'cli-004', name: 'Дмитро Бойко', lastVisitDaysAgo: 15, totalVisits: 2, totalSpent: 1300 },
  ]);

  const [selectedClient, setSelectedClient] = useState<ClientProfile>(clients[0]!);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const calculateCampaign = (client: ClientProfile) => {
    if (client.lastVisitDaysAgo >= 90) {
      return {
        tier: '90+ днів неактивності (Severe Churn Risk)',
        discount: 30,
        promo: `WNB-${client.clientId.toUpperCase()}-30`,
        bonus: 'Безкоштовне підрівнювання бороди та гарячий рушник',
        urgency: 'critical',
      };
    } else if (client.lastVisitDaysAgo >= 60) {
      return {
        tier: '60 днів неактивності (High Risk)',
        discount: 25,
        promo: `WNB-${client.clientId.toUpperCase()}-25`,
        bonus: 'Фірмовий гель для стайлінгу у подарунок',
        urgency: 'warning',
      };
    } else if (client.lastVisitDaysAgo >= 30) {
      return {
        tier: '30 днів неактивності (Watchlist)',
        discount: 15,
        promo: `WNB-${client.clientId.toUpperCase()}-15`,
        bonus: 'Пріоритетне бронювання',
        urgency: 'accent',
      };
    }
    return {
      tier: 'Активний клієнт',
      discount: 0,
      promo: 'N/A',
      bonus: 'Реферальний бонус доступний',
      urgency: 'success',
    };
  };

  const currentCampaign = calculateCampaign(selectedClient);

  const handleLaunchCampaign = () => {
    setSuccessMessage(`Кампанію реактивації для "${selectedClient.name}" успішно запущено (Промокод: ${currentCampaign.promo})! SMS/Push сповіщення надіслано.`);
    setTimeout(() => setSuccessMessage(null), 4500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Badge tone="accent" className="w-max">Customer Acquisition & Retention Specialist</Badge>
        <h1 className="font-display text-3xl font-bold">Win-Back & Reactivation Dashboard</h1>
        <p className="text-body text-fg-secondary">
          Автоматизоване управління реактивацією неактивних клієнтів, персоналізовані знижки та утримання VIP-аудиторії FADE.
        </p>
      </header>

      {successMessage && (
        <AlertBanner tone="success" title="Успішно!">
          {successMessage}
        </AlertBanner>
      )}

      {/* Client Selector & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col gap-4 md:col-span-1">
          <h2 className="font-display text-xl font-semibold">База клієнтів (Ризик відтоку)</h2>
          <div className="flex flex-col gap-2">
            {clients.map((cli) => (
              <button
                key={cli.clientId}
                onClick={() => setSelectedClient(cli)}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-colors ${
                  selectedClient.clientId === cli.clientId
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
                <span className="text-caption text-fg-secondary">Візитів: {cli.totalVisits} | Витрачено: {cli.totalSpent} ₴</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Campaign Simulator Details */}
        <Card className="p-6 flex flex-col justify-between gap-6 md:col-span-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-caption uppercase text-fg-secondary tracking-wider">Обраний клієнт</span>
                <h3 className="font-display text-2xl font-bold text-fg mt-1">{selectedClient.name}</h3>
              </div>
              <Badge tone={currentCampaign.urgency as any}>{currentCampaign.tier}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-surface-sunken border border-line flex flex-col gap-1">
                <span className="text-caption text-fg-secondary">Знижка реактивації</span>
                <span className="font-display text-2xl font-bold text-accent">-{currentCampaign.discount}%</span>
              </div>
              <div className="p-4 rounded-lg bg-surface-sunken border border-line flex flex-col gap-1">
                <span className="text-caption text-fg-secondary">Промокод</span>
                <span className="font-display text-h4 font-mono font-bold text-fg">{currentCampaign.promo}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface-sunken border border-line flex flex-col gap-1">
              <span className="text-caption text-fg-secondary">Бонусний сервіс / Подарунок</span>
              <span className="text-body font-medium text-fg">{currentCampaign.bonus}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-line">
            <Button className="w-full sm:w-auto flex-1" onClick={handleLaunchCampaign}>
              Запустити Win-Back кампанію (SMS / Push)
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => {
              setClients(prev => prev.map(c => c.clientId === selectedClient.clientId ? { ...c, lastVisitDaysAgo: 5 } : c));
              setSelectedClient(prev => ({ ...prev, lastVisitDaysAgo: 5 }));
              setSuccessMessage(`Клієнта "${selectedClient.name}" успішно реактивовано!`);
              setTimeout(() => setSuccessMessage(null), 3500);
            }}>
              Позначити як реактивованого
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
