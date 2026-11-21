'use client';

import { useState } from 'react';
import { Badge, AlertBanner } from '@fade/ui';
import { CLIENTS, calculateCampaign, type ClientProfile } from './winback-campaign';
import { WinbackClientList } from './WinbackClientList';
import { WinbackCampaignCard } from './WinbackCampaignCard';

export default function WinbackDashboardPage() {
  const [clients, setClients] = useState<ClientProfile[]>(CLIENTS);
  const [selectedClient, setSelectedClient] = useState<ClientProfile>(CLIENTS[0]!);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentCampaign = calculateCampaign(selectedClient);

  const handleLaunchCampaign = () => {
    setSuccessMessage(
      `Кампанію реактивації для "${selectedClient.name}" успішно запущено (Промокод: ${currentCampaign.promo})! SMS/Push сповіщення надіслано.`
    );
    setTimeout(() => setSuccessMessage(null), 4500);
  };

  const handleReactivate = () => {
    setClients((prev) =>
      prev.map((c) => (c.clientId === selectedClient.clientId ? { ...c, lastVisitDaysAgo: 5 } : c))
    );
    setSelectedClient((prev) => ({ ...prev, lastVisitDaysAgo: 5 }));
    setSuccessMessage(`Клієнта "${selectedClient.name}" успішно реактивовано!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Badge tone="accent" className="w-max">
          Customer Acquisition & Retention Specialist
        </Badge>
        <h1 className="font-display text-3xl font-bold">Win-Back & Reactivation Dashboard</h1>
        <p className="text-body text-fg-secondary">
          Автоматизоване управління реактивацією неактивних клієнтів, персоналізовані знижки та
          утримання VIP-аудиторії FADE.
        </p>
      </header>

      {successMessage && (
        <AlertBanner tone="success" title="Успішно!">
          {successMessage}
        </AlertBanner>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WinbackClientList
          clients={clients}
          selectedClientId={selectedClient.clientId}
          onSelect={setSelectedClient}
        />
        <WinbackCampaignCard
          client={selectedClient}
          campaign={currentCampaign}
          onLaunch={handleLaunchCampaign}
          onReactivate={handleReactivate}
        />
      </div>
    </div>
  );
}
