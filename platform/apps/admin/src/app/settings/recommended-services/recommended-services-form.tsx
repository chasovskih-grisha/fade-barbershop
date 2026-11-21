'use client';

import { useState } from 'react';
import { Button } from '@fade/ui';
import type { RecommendedServicesSettings } from '../recommended-services-fields';

const parseManualPeak = (raw: string): string[] =>
  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

function validate(values: RecommendedServicesSettings): string | null {
  if (!Number.isInteger(values.topN) || values.topN < 1 || values.topN > 50) {
    return 'Кількість послуг: допустиме значення від 1 до 50';
  }
  if (!Number.isInteger(values.cacheTtlMs) || values.cacheTtlMs < 0) {
    return 'TTL кешування: допустиме ціле число ≥ 0';
  }
  return null;
}

export default function RecommendedServicesForm({
  settings,
  saving,
  onSave,
}: {
  settings: RecommendedServicesSettings | null;
  saving: boolean;
  onSave: (values: RecommendedServicesSettings) => Promise<string | null>;
}) {
  const [values, setValues] = useState<RecommendedServicesSettings>(
    settings ?? { enabled: false, topN: 3, manualPeak: [], cacheTtlMs: 300000 }
  );
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const failure = validate(values);
    if (failure) {
      setError(failure);
      return;
    }
    setError(await onSave(values));
  };

  const fieldClass = 'rounded border border-line bg-surface px-3 py-2';

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4"
      aria-label="Налаштування рекомендованих послуг"
    >
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={values.enabled}
          onChange={(e) => setValues((v) => ({ ...v, enabled: e.target.checked }))}
        />
        Увімкнути блок рекомендованих послуг
      </label>
      <label className="flex flex-col gap-1">
        Кількість послуг у блоці (top-N)
        <input
          type="number"
          className={fieldClass}
          value={values.topN}
          onChange={(e) => setValues((v) => ({ ...v, topN: Number(e.target.value) }))}
        />
      </label>
      <label className="flex flex-col gap-1">
        Послуги для примусового показу (ID через кому)
        <input
          type="text"
          className={fieldClass}
          value={values.manualPeak.join(', ')}
          onChange={(e) =>
            setValues((v) => ({ ...v, manualPeak: parseManualPeak(e.target.value) }))
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        TTL кешування (мс)
        <input
          type="number"
          className={fieldClass}
          value={values.cacheTtlMs}
          onChange={(e) => setValues((v) => ({ ...v, cacheTtlMs: Number(e.target.value) }))}
        />
      </label>
      {error ? (
        <p role="alert" className="text-semantic-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={saving}>
        {saving ? 'Збереження…' : 'Зберегти'}
      </Button>
    </form>
  );
}
