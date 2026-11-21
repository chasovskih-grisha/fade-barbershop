/** T-4464: «Слабкі години» — пороги заповненості, робочі години й кількість крісел. */

'use client';

import { useState } from 'react';
import { AlertBanner } from '@fade/ui';
import PageHeader from '../../components/PageHeader';
import SettingsTabs from '../settings-tabs';
import { useAdminToasts } from '../../components/use-admin-toasts';
import SlowHoursForm from './slow-hours-form';

export default function SlowHoursSettingsPage() {
  const { push } = useAdminToasts();
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="Слабкі години (T-4464)"
        subtitle="Налаштування порогів замовленості, робочих годин та кількості крісел"
      />
      <SettingsTabs />

      {saved ? (
        <AlertBanner tone="success" title="Успіх">
          Налаштування збережено
        </AlertBanner>
      ) : null}

      <SlowHoursForm
        onSaved={() => {
          setSaved(true);
          push('Налаштування збережено');
        }}
      />
    </div>
  );
}
