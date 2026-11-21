'use client';

import { AlertBanner, Button } from '@fade/ui';
import ReferralNumberField from './ReferralNumberField';
import type { ReferralProgramSettings } from './referral-model';

export default function ReferralSettingsCard({
  settings,
  saved,
  onChange,
  onSave,
}: {
  settings: ReferralProgramSettings;
  saved: boolean;
  onChange: (patch: Partial<ReferralProgramSettings>) => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-card bg-surface p-6 shadow-card">
      <h2 className="text-h2 font-semibold text-fg mb-4">Налаштування програми (RFR-ADM-01)</h2>
      {saved ? (
        <div className="mb-4">
          <AlertBanner
            tone="success"
            title="Збережено"
            description="Параметри реферальної програми оновлено."
          />
        </div>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <ReferralNumberField
          label="Знижка рефералу (%)"
          value={settings.referralDiscountPct}
          onChange={(referralDiscountPct) => onChange({ referralDiscountPct })}
        />
        <div>
          <label className="block text-body-sm font-medium text-fg-secondary mb-1">
            Винагорода запрошувачу
          </label>
          <input
            type="text"
            value={settings.rewardAmount}
            onChange={(event) => onChange({ rewardAmount: event.target.value })}
            className="w-full rounded-input border border-border bg-surface px-3 py-2 text-fg"
          />
        </div>
        <ReferralNumberField
          label="Строк дії винагороди (днів)"
          value={settings.rewardExpiryDays}
          onChange={(rewardExpiryDays) => onChange({ rewardExpiryDays })}
        />
        <ReferralNumberField
          label="Вікно атрибуції (днів)"
          value={settings.attributionWindowDays}
          onChange={(attributionWindowDays) => onChange({ attributionWindowDays })}
        />
        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="programEnabled"
            checked={settings.enabled}
            onChange={(event) => onChange({ enabled: event.target.checked })}
            className="h-4 w-4 rounded border-border text-accent-blue"
          />
          <label htmlFor="programEnabled" className="text-body font-medium text-fg">
            Програма увімкнена
          </label>
        </div>
        <div className="flex items-end">
          <Button type="submit" variant="primary">
            Зберегти налаштування
          </Button>
        </div>
      </form>
    </div>
  );
}
