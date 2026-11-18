'use client';

// Форма політики депозиту (PAY-ADM-09): відсоток, крок округлення і вікно
// скасування. Валідація — deposit-policy-fields.ts; кнопка заблокована, поки
// значення поза діапазоном, щоб API не відкидав запис мовчки.
import { useState } from 'react';
import { Button } from '@fade/ui';
import {
  FIELD_CLASS,
  ROUNDING_OPTIONS,
  draftError,
  toDraft,
  toPolicy,
  type DepositPolicy,
  type DepositPolicyDraft,
} from './deposit-policy-fields';

export default function DepositPolicyForm({
  policy,
  saving,
  onSave,
}: {
  policy: DepositPolicy;
  saving: boolean;
  onSave: (policy: DepositPolicy) => void;
}) {
  const [draft, setDraft] = useState<DepositPolicyDraft>(() => toDraft(policy));
  const error = draftError(draft);
  const set = (patch: Partial<DepositPolicyDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  return (
    <form
      className="flex flex-col gap-5 rounded-card border border-line bg-surface-raised p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!error) onSave(toPolicy(draft));
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="deposit-percent" className="text-body text-fg">
          Відсоток від ціни візиту (0 — депозит вимкнено)
        </label>
        <input
          id="deposit-percent"
          type="number"
          min={0}
          max={100}
          className={FIELD_CLASS}
          value={draft.percent}
          disabled={saving}
          onChange={(event) => set({ percent: event.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="deposit-rounding" className="text-body text-fg">
          Округлення суми депозиту
        </label>
        <select
          id="deposit-rounding"
          className={FIELD_CLASS}
          value={draft.rounding}
          disabled={saving}
          onChange={(event) => set({ rounding: Number(event.target.value) })}
        >
          {ROUNDING_OPTIONS.map((step) => (
            <option key={step} value={step}>
              {step} грн
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="deposit-window" className="text-body text-fg">
          Вікно безкоштовного скасування, годин
        </label>
        <input
          id="deposit-window"
          type="number"
          min={0}
          max={72}
          className={FIELD_CLASS}
          value={draft.cancellationWindowHours}
          disabled={saving}
          onChange={(event) => set({ cancellationWindowHours: event.target.value })}
        />
        <p className="text-caption text-fg-secondary">
          До початку візиту; дедлайн у кабінеті рахується від часу візиту.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-caption text-semantic-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" className="w-fit" disabled={!!error || saving}>
        {saving ? 'Збереження...' : 'Зберегти'}
      </Button>
    </form>
  );
}
