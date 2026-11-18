'use client';

import { useRouter } from 'next/navigation';
import { AlertBanner, Button } from '@fade/ui';
import { phoneBookingPath } from '../phone-booking-path';
import type { ClientTab } from './client-types';
import { ClientHeader } from './ClientHeader';
import { ClientProfileTab } from './ClientProfileTab';
import { ClientPreferencesTab } from './ClientPreferencesTab';
import { ClientNotesTab } from './ClientNotesTab';
import { ClientLoyaltyTab } from './ClientLoyaltyTab';
import { AddNoteModal } from './AddNoteModal';
import { useClientDetail } from './useClientDetail';

export default function ClientDetailPage() {
  const detail = useClientDetail();
  const router = useRouter();

  if (detail.loading) {
    return <div />;
  }

  if (detail.error || !detail.client) {
    return (
      <div>
        <AlertBanner tone="error" title="Помилка">
          {detail.error ?? 'Клієнта не знайдено'}
        </AlertBanner>
      </div>
    );
  }

  const { client } = detail;
  const tabs: { id: ClientTab; label: string }[] = [
    { id: 'profile', label: 'Профіль' },
    { id: 'preferences', label: 'Вподобання' },
    { id: 'notes', label: `Нотатки (${client.notes.length})` },
    { id: 'loyalty', label: `Лояльність (${client.loyaltyVisitsCount}/7)` },
  ];

  return (
    <div>
      <ClientHeader
        name={client.name}
        phone={client.phone}
        tabs={tabs}
        activeTab={detail.activeTab}
        onTabChange={detail.setActiveTab}
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={() => router.push(phoneBookingPath(client))}
          >
            Записати
          </Button>
        }
      />
      {detail.activeTab === 'profile' && (
        <ClientProfileTab
          name={client.name}
          phone={client.phone}
          vipDiscount={detail.vipDiscount}
          currentVipPercent={client.vipDiscountPercent}
          saving={detail.saving}
          onVipChange={detail.setVipDiscount}
          onSaveVip={detail.handleSaveVipDiscount}
        />
      )}
      {detail.activeTab === 'preferences' && (
        <ClientPreferencesTab preferences={client.preferences} />
      )}
      {detail.activeTab === 'notes' && (
        <ClientNotesTab
          notes={client.notes}
          onAdd={() => detail.setShowNoteModal(true)}
          onRemove={detail.handleRemoveNote}
        />
      )}
      {detail.activeTab === 'loyalty' && (
        <ClientLoyaltyTab visitsCount={client.loyaltyVisitsCount} />
      )}
      {detail.showNoteModal && (
        <AddNoteModal
          noteText={detail.noteText}
          noteAuthorRole={detail.noteAuthorRole}
          noteVisibleToClient={detail.noteVisibleToClient}
          saving={detail.saving}
          onTextChange={detail.setNoteText}
          onAuthorRoleChange={detail.setNoteAuthorRole}
          onVisibleChange={detail.setNoteVisibleToClient}
          onCancel={() => detail.setShowNoteModal(false)}
          onSave={detail.handleAddNote}
        />
      )}
    </div>
  );
}
