'use client';

// Налаштування → Підтвердження запису: канал email/sms/both/none; чинність
// негайно. Логіка load/save — use-confirmation-settings.ts; опції —
// channel-selector.tsx, розділи — settings-tabs.tsx (LOC-гейт).
import { useState } from 'react';
import { AlertBanner, Skeleton } from '@fade/ui';
import PageHeader from '../../components/PageHeader';
import SettingsTabs from '../settings-tabs';
import { useAdminToasts } from '../../components/use-admin-toasts';
import ChannelSelector from './channel-selector';
import { useConfirmationSettings } from './use-confirmation-settings';

export default function BookingConfirmationSettingsPage() {
  const { push, viewport } = useAdminToasts();
  const { settings, loadError, saving, save } = useConfirmationSettings();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="Підтвердження запису"
        subtitle="Як повідомляти про новий запис; чинність — негайно, без деплою"
      />
      <SettingsTabs />

      {loadError ? (
        <AlertBanner
          tone="error"
          title="Помилка"
          action={{ label: 'Спробувати ще раз', onClick: () => location.reload() }}
        >
          Не вдалося завантажити налаштування.
        </AlertBanner>
      ) : settings ? (
        <ChannelSelector
          channel={settings.channel}
          saving={saving}
          onChange={async (channel) => {
            // Помилка лишається inline (role=alert); успіх — тост, що зникає.
            const error = await save(channel);
            if (error) setError(error);
            else push('Канал підтвердження збережено');
          }}
        />
      ) : (
        <Skeleton variant="rect" className="h-64" />
      )}

      {error && (
        <AlertBanner tone="error" title="Помилка">
          {error}
        </AlertBanner>
      )}
      {viewport}
    </div>
  );
}
