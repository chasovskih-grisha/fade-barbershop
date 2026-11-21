/** T-4464: налаштування блоку рекомендованих послуг. */

'use client';

import { useState } from 'react';
import { AlertBanner } from '@fade/ui';
import PageHeader from '../../components/PageHeader';
import SettingsTabs from '../settings-tabs';
import { useRecommendedServicesSettings } from '../use-recommended-services-settings';
import RecommendedServicesForm from './recommended-services-form';

export default function RecommendedServicesSettingsPage() {
  const { settings, loadError, saving, save } = useRecommendedServicesSettings();
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="Рекомендовані послуги"
        subtitle="Керування блоком рекомендованих послуг на головній сторінці"
      />
      <SettingsTabs />

      {loadError ? (
        <AlertBanner tone="error" title="Помилка">
          Не вдалося завантажити налаштування
        </AlertBanner>
      ) : null}
      {saved ? (
        <AlertBanner tone="success" title="Успіх">
          Налаштування збережено
        </AlertBanner>
      ) : null}

      <RecommendedServicesForm
        settings={settings}
        saving={saving}
        onSave={async (values) => {
          const error = await save(values);
          if (!error) setSaved(true);
          return error;
        }}
      />
    </div>
  );
}
