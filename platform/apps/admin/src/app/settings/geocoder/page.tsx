'use client';

// Налаштування → Геокодування (MNG-ADM-18: «зміна інтеграцій не потребує
// деплою»): провайдер зберігається в AppSetting (ADR 0022), PUT застосовується
// негайно. Cookie-автентифікація прямує крізь rewrite /admin/* → API.

import { ProviderSelector } from './components/ProviderSelector';
import { LimitsDisplay } from './components/LimitsDisplay';
import { LoadError } from './components/LoadError';
import { GeocoderHeader } from './components/Header';
import { Notice } from './components/Notice';
import SettingsTabs from '../settings-tabs';
import { useGeocoderSettings } from './use-geocoder-settings';

export default function GeocoderSettingsPage() {
  const { settings, loadError, saving, notice, load, save } = useGeocoderSettings();

  if (loadError) return <LoadError onRetry={load} />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <GeocoderHeader />
      <SettingsTabs />

      {/* prettier-ignore */}
      {settings ? (
        <ProviderSelector
          settings={settings}
          saving={saving}
          onChange={(provider) => void save({ provider })}
        />
      ) : null}
      {/* prettier-ignore */}
      {settings ? (
        <LimitsDisplay rateLimit={settings.rateLimit} cacheTtlMs={settings.cacheTtlMs} />
      ) : null}

      <Notice notice={notice} />
    </div>
  );
}
