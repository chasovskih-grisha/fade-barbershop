'use client';

import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { Button, AlertBanner } from '@fade/ui';
import { RetentionEngine } from '@fade/domain-shared';

interface InactiveClient {
  id: string;
  name: string;
  phone: string;
  lastVisitDate: string;
  totalSpent: number;
  visitsCount: number;
}

const INITIAL_CLIENTS: InactiveClient[] = [
  {
    id: 'client-101',
    name: 'Maksym Velychko',
    phone: '+380675554433',
    lastVisitDate: '2026-08-15',
    totalSpent: 3400,
    visitsCount: 8,
  },
  {
    id: 'client-102',
    name: 'Dmytro Kozak',
    phone: '+380507778899',
    lastVisitDate: '2026-07-01',
    totalSpent: 6200,
    visitsCount: 15,
  },
  {
    id: 'client-103',
    name: 'Andriy Melnichenko',
    phone: '+380931234567',
    lastVisitDate: '2026-10-05',
    totalSpent: 1200,
    visitsCount: 3,
  },
];

export default function RetentionPage() {
  const [clients] = useState<InactiveClient[]>(INITIAL_CLIENTS);
  const [engine] = useState(() => new RetentionEngine());
  const [selectedClient, setSelectedClient] = useState<InactiveClient | null>(null);
  const [campaignResult, setCampaignResult] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSimulateWinBack = (client: InactiveClient) => {
    setSelectedClient(client);
    const result = engine.calculateWinBackOffer({
      clientId: client.id,
      lastVisitDate: client.lastVisitDate,
      currentDate: '2026-11-11T23:18:55Z',
      previousVisitsCount: client.visitsCount,
    });
    setCampaignResult(result);
    setSuccessMsg(null);
  };

  const handleSendCampaign = () => {
    if (!selectedClient || !campaignResult) return;
    setSuccessMsg(`Кампанію утримання успішно надіслано клієнту ${selectedClient.name} (Код: ${campaignResult.promoCode}, Знижка: ${campaignResult.discountPercentage}%)!`);
    setSelectedClient(null);
    setCampaignResult(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Утримання клієнтів та Win-Back кампанії"
        subtitle="Автоматизовані реактиваційні кампанії для неактивних клієнтів за методологією RetentionEngine"
      />

      {successMsg && (
        <AlertBanner tone="success" title="Успішно" description={successMsg} />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-card border border-line shadow-sm">
          <p className="text-sm text-fg-muted font-medium">Активна базова база</p>
          <p className="text-2xl font-bold text-fg mt-1">1,420</p>
          <span className="text-xs text-semantic-success font-semibold mt-1 inline-block">+12% цього місяця</span>
        </div>
        <div className="bg-white p-4 rounded-card border border-line shadow-sm">
          <p className="text-sm text-fg-muted font-medium">Неактивні (&gt;30 днів)</p>
          <p className="text-2xl font-bold text-semantic-warning mt-1">312</p>
          <span className="text-xs text-fg-muted mt-1 inline-block">Готові до Win-Back</span>
        </div>
        <div className="bg-white p-4 rounded-card border border-line shadow-sm">
          <p className="text-sm text-fg-muted font-medium">Реактивовані</p>
          <p className="text-2xl font-bold text-accent-blue mt-1">84</p>
          <span className="text-xs text-semantic-success font-semibold mt-1 inline-block">27% конверсія</span>
        </div>
        <div className="bg-white p-4 rounded-card border border-line shadow-sm">
          <p className="text-sm text-fg-muted font-medium">Середній LTV</p>
          <p className="text-2xl font-bold text-accent-blue mt-1">8,450 UAH</p>
          <span className="text-xs text-semantic-success font-semibold mt-1 inline-block">+450 UAH vs торік</span>
        </div>
      </div>

      {/* Inactive Clients Section */}
      <div className="bg-white rounded-card border border-line shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex justify-between items-center">
          <div>
            <h3 className="font-display text-h4 font-bold text-fg">Черга реактивації неактивних клієнтів</h3>
            <p className="text-sm text-fg-muted">Виберіть клієнта для розрахунку персоналізованої знижки та запуску SMS/Push Win-Back пропозиції.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-sunken text-fg-secondary text-xs font-semibold uppercase tracking-wider border-b border-line">
                <th className="px-6 py-3">Клієнт</th>
                <th className="px-6 py-3">Останній візит</th>
                <th className="px-6 py-3">Візити</th>
                <th className="px-6 py-3">Витрачено</th>
                <th className="px-6 py-3 text-right">Дія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-sm">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-surface-sunken transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-fg">{c.name}</p>
                    <p className="text-xs text-fg-muted">{c.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-fg">{c.lastVisitDate}</td>
                  <td className="px-6 py-4 text-fg">{c.visitsCount}</td>
                  <td className="px-6 py-4 font-semibold text-fg">{c.totalSpent} UAH</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="secondary" onClick={() => handleSimulateWinBack(c)}>
                      Розрахувати Win-Back
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Simulation Modal / Card */}
      {selectedClient && campaignResult && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-card p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-semantic-warning/20 text-semantic-warning text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Win-Back Кампанія · Рівень: {campaignResult.tier}
              </span>
              <h3 className="text-xl font-bold mt-2">Реактивація для {selectedClient.name}</h3>
              <p className="text-fg-secondary text-sm mt-1">
                Клієнт не відвідував салон {campaignResult.inactivityDays} днів. Розраховано оптимізовану пропозицію за критеріями RetentionEngine.
              </p>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-fg-muted hover:text-white text-sm font-semibold"
            >
              ✕ Закрити
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/10 p-4 rounded-card backdrop-blur-sm">
            <div>
              <p className="text-xs text-fg-secondary">Знижка</p>
              <p className="text-2xl font-bold text-semantic-warning">{campaignResult.discountPercentage}%</p>
            </div>
            <div>
              <p className="text-xs text-fg-secondary">Промокод</p>
              <p className="text-xl font-mono font-bold text-white">{campaignResult.promoCode}</p>
            </div>
            <div>
              <p className="text-xs text-fg-secondary">Бонусний подарунок</p>
              <p className="text-sm font-medium text-white">{campaignResult.bonusPerk || 'Стандартний догляд'}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setSelectedClient(null)} className="text-white hover:bg-white/10">
              Скасувати
            </Button>
            <Button variant="primary" onClick={handleSendCampaign} className="bg-semantic-warning hover:bg-interactive-hover text-fg font-bold">
              Надіслати пропозицію (SMS / Push)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
