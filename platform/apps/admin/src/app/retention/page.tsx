'use client';

import { useState } from 'react';
import { AlertBanner } from '@fade/ui';
import PageHeader from '../components/PageHeader';
import { RetentionEngine } from '@fade/domain-shared';
import RetentionClientsTable from './RetentionClientsTable';
import RetentionKpis from './RetentionKpis';
import WinBackCard, { type WinBackOffer } from './WinBackCard';
import { INITIAL_CLIENTS, type InactiveClient } from './retention-data';

export default function RetentionPage() {
  const [clients] = useState<InactiveClient[]>(INITIAL_CLIENTS);
  const [engine] = useState(() => new RetentionEngine());
  const [selected, setSelected] = useState<InactiveClient | null>(null);
  const [offer, setOffer] = useState<WinBackOffer | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const simulate = (client: InactiveClient): void => {
    setSelected(client);
    setOffer(
      engine.calculateWinBackOffer({
        clientId: client.id,
        lastVisitDate: client.lastVisitDate,
        currentDate: '2026-11-11T23:18:55Z',
        previousVisitsCount: client.visitsCount,
      })
    );
    setSuccess(null);
  };

  const send = (): void => {
    if (!selected || !offer) return;
    setSuccess(
      `Кампанію утримання успішно надіслано клієнту ${selected.name} (Код: ${offer.promoCode}, Знижка: ${offer.discountPercentage}%)!`
    );
    setSelected(null);
    setOffer(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Утримання клієнтів та Win-Back кампанії"
        subtitle="Автоматизовані реактиваційні кампанії для неактивних клієнтів за методологією RetentionEngine"
      />
      {success ? <AlertBanner tone="success" title="Успішно" description={success} /> : null}
      <RetentionKpis />
      <RetentionClientsTable clients={clients} onCalculate={simulate} />
      {selected && offer ? (
        <WinBackCard
          client={selected}
          offer={offer}
          onClose={() => setSelected(null)}
          onSend={send}
        />
      ) : null}
    </div>
  );
}
