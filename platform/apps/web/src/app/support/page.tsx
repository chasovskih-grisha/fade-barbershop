'use client';

import { useState } from 'react';
import { SupportHero } from './SupportHero';
import { QuickConciergeCards } from './QuickConciergeCards';
import { SupportDiagnostic } from './SupportDiagnostic';
import { SupportChat } from './SupportChat';
import { CallbackWidget } from './CallbackWidget';
import { SupportFaq } from './SupportFaq';
import { TicketTracker } from './TicketTracker';
import { SubmitTicket } from './SubmitTicket';
import { CsatWidget } from './CsatWidget';

export default function SupportCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [diagnosticScenario, setDiagnosticScenario] = useState<string | null>(null);

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText('+380443334455');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <SupportHero searchQuery={searchQuery} onSearch={setSearchQuery} />

      <QuickConciergeCards copiedPhone={copiedPhone} onCopyPhone={handleCopyPhone} />

      <SupportDiagnostic selectedId={diagnosticScenario} onSelect={setDiagnosticScenario} />

      <SupportChat />

      <CallbackWidget />

      <SupportFaq
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onSearch={setSearchQuery}
        onCategory={setSelectedCategory}
      />

      <TicketTracker />

      <SubmitTicket />

      <CsatWidget />
    </div>
  );
}
