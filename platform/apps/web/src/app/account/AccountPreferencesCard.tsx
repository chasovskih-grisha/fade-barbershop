'use client';

import Link from 'next/link';
import { Card, Field, Button } from '@fade/ui';
import {
  PREFERENCE_LIMIT_MESSAGE,
  isWithinPreferenceLimit,
  splitPreferenceLines,
} from './preferences';

export function AccountPreferencesCard({
  preferences,
  savedPreferences,
  saving,
  saveStatus,
  onChange,
  onSave,
}: {
  preferences: string;
  savedPreferences: string[];
  saving: boolean;
  saveStatus: 'idle' | 'success' | 'error';
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  const lines = splitPreferenceLines(preferences);
  const withinLimit = isWithinPreferenceLimit(lines);
  const limitError = withinLimit ? null : PREFERENCE_LIMIT_MESSAGE;
  const canSave = !saving && withinLimit && preferences !== savedPreferences.join('\n');
  return (
    <Card className="flex flex-col gap-4 p-6">
      <h2 className="font-display text-display">Вподобання</h2>
      <Field id="preferences" label="Алергії, уподобання, побажання для майстра">
        <textarea
          id="preferences"
          className="h-24 rounded-input border border-line bg-surface-base px-3 font-text text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue resize-none"
          value={preferences}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Наприклад: алергія на ефірні олії, не люблю розмов під час стрижки..."
          disabled={saving}
          aria-invalid={limitError ? true : undefined}
          aria-describedby={limitError ? 'preferences-limit-error' : undefined}
        />
      </Field>
      {limitError ? (
        <p id="preferences-limit-error" role="alert" className="text-body-s text-danger">
          {limitError}
        </p>
      ) : null}
      <p className="text-body-s text-fg-secondary">Цей текст побачить ваш майстер перед візитом</p>
      <div className="flex items-center gap-3">
        <Button size="md" onClick={onSave} disabled={!canSave} className="w-fit">
          {saving ? 'Збереження...' : 'Зберегти вподобання'}
        </Button>
        {saveStatus === 'success' && <p className="text-body-s text-success">Збережено</p>}
        {saveStatus === 'error' && <p className="text-body-s text-danger">Помилка збереження. Спробуйте ще раз.</p>}
      </div>
    </Card>
  );
}

export function AccountReferralsLink() {
  return (
    <Card className="flex flex-col gap-2 p-6">
      <h2 className="font-display text-display">Реферальна програма</h2>
      <p className="text-body-s text-fg-secondary">
        Запрошуйте друзів і отримуйте бонус на наступні візити.
      </p>
      <Link
        href="/account/referrals"
        className="mt-1 w-fit font-text text-body font-medium text-accent-blue underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
      >
        Відкрити реферальну програму
      </Link>
    </Card>
  );
}
