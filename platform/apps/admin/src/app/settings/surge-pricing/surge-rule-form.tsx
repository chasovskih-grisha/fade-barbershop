'use client';

// Форма правила surge (T-4811): день, вікно, рівень барбера і множник.
// Валідація — surge-rule-draft.ts; кнопка заблокована, поки значення поза
// межами API, щоб «збережено» не з'являлося на відкинутому правилі.
import { useState } from 'react';
import { Button } from '@fade/ui';
import {
  EMPTY_DRAFT,
  draftError,
  toDraft,
  toPayload,
  type SurgeRuleDraft,
  type SurgeRulePayload,
  type SurgeRuleRow,
} from './surge-rule-draft';
import { DAY_LABELS } from './surge-rule-view';
import SurgeRuleLimits from './surge-rule-limits';
import type { LocationOption } from './use-surge-rules';

const FIELD_CLASS =
  'h-11 w-full rounded-input border border-line bg-surface-base px-3 text-body text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

export default function SurgeRuleForm({
  editing,
  locations,
  saving,
  onSave,
}: {
  editing: SurgeRuleRow | null;
  locations: LocationOption[];
  saving: boolean;
  onSave: (payload: SurgeRulePayload, id?: string) => void;
}) {
  const [draft, setDraft] = useState<SurgeRuleDraft>(() =>
    editing ? toDraft(editing) : EMPTY_DRAFT
  );
  const error = draftError(draft);
  const set = (patch: Partial<SurgeRuleDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  return (
    <form
      aria-label="Правило surge"
      className="flex flex-col gap-4 rounded-card border border-line bg-surface-raised p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!error) onSave(toPayload(draft), editing?.id);
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2 text-body text-fg">
          Локація (порожньо — вся мережа)
          <select
            aria-label="Локація"
            className={FIELD_CLASS}
            value={draft.locationId}
            disabled={saving}
            onChange={(event) => set({ locationId: event.target.value })}
          >
            <option value="">Вся мережа</option>
            {locations.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-body text-fg">
          День тижня
          <select
            aria-label="День тижня"
            className={FIELD_CLASS}
            value={draft.dayOfWeek}
            disabled={saving}
            onChange={(event) => set({ dayOfWeek: event.target.value })}
          >
            <option value="">Будь-який</option>
            {DAY_LABELS.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <SurgeRuleLimits draft={draft} saving={saving} set={set} />

      {error ? (
        <p role="alert" className="text-caption text-semantic-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" className="w-fit" disabled={!!error || saving}>
        {saving ? 'Збереження...' : editing ? 'Зберегти правило' : 'Додати правило'}
      </Button>
    </form>
  );
}
