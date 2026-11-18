'use client';

// Налаштування → Нагадування про візит (T-080): канал sms/none і час «за N
// годин», чинні одразу — без деплою. Логіка load/save — use-reminder-settings.ts;
// селектори — channel-selector.tsx і lead-time-selector.tsx.
import { useState } from 'react';
import { AlertBanner, Skeleton } from '@fade/ui';
import PageHeader from '../../components/PageHeader';
import SettingsTabs from '../settings-tabs';
import { useAdminToasts } from '../../components/use-admin-toasts';
import ChannelSelector from './channel-selector';
import LeadTimeSelector from './lead-time-selector';
import { useReminderSettings, type ReminderSettings } from './use-reminder-settings';

export default function AppointmentReminderSettingsPage() {
  const { push, viewport } = useAdminToasts();
  const { settings, loadError, saving, save } = useReminderSettings();
  const [error, setError] = useState<string | null>(null);

  // Помилка лишається inline (role=alert); успіх — тост, що зникає.
  const apply = async (patch: Partial<ReminderSettings>, toast: string): Promise<void> => {
    const failure = await save(patch);
    if (failure) setError(failure);
    else push(toast);
  };

  return (
    <div className="mx-auto flex max-w-container flex-col gap-6">
      <PageHeader
        title="Нагадування про візит"
        subtitle="Канал і час до візиту; чинність — негайно, без деплою"
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
        <>
          <ChannelSelector
            channel={settings.channel}
            saving={saving}
            onChange={(channel) => void apply({ channel }, 'Канал нагадування збережено')}
          />
          <LeadTimeSelector
            leadMinutes={settings.leadMinutes}
            saving={saving}
            onChange={(leadMinutes) => void apply({ leadMinutes }, 'Час нагадування збережено')}
          />
        </>
      ) : (
        <Skeleton variant="rect" className="h-64" />
      )}

      {error ? (
        <AlertBanner tone="error" title="Помилка">
          {error}
        </AlertBanner>
      ) : null}
      {viewport}
    </div>
  );
}
