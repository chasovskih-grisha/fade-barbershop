'use client';

// Межі правила surge (T-4811): вікно доби, множник і рівень барбера.
// Виокремлено з форми за LOC-гейтом (ADR 0019); стан лишається в формі.
import { TextField } from '@fade/ui';
import { PERCENT_RANGE, type SurgeRuleDraft } from './surge-rule-draft';

const FIELD_CLASS =
  'h-11 w-full rounded-input border border-line bg-surface-base px-3 text-body text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

export default function SurgeRuleLimits({
  draft,
  saving,
  set,
}: {
  draft: SurgeRuleDraft;
  saving: boolean;
  set: (patch: Partial<SurgeRuleDraft>) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <TextField
          label="Від"
          type="time"
          value={draft.fromTime}
          disabled={saving}
          onChange={(event) => set({ fromTime: event.target.value })}
        />
        <TextField
          label="До"
          type="time"
          value={draft.toTime}
          disabled={saving}
          onChange={(event) => set({ toTime: event.target.value })}
        />
        <TextField
          label="Множник, %"
          type="number"
          min={PERCENT_RANGE.min}
          max={PERCENT_RANGE.max}
          value={draft.multiplierPercent}
          disabled={saving}
          onChange={(event) => set({ multiplierPercent: event.target.value })}
        />
      </div>

      <label className="flex flex-col gap-2 text-body text-fg">
        Рівень барбера
        <select
          aria-label="Рівень барбера"
          className={FIELD_CLASS}
          value={draft.seniorityTier}
          disabled={saving}
          onChange={(event) => set({ seniorityTier: event.target.value })}
        >
          <option value="">Будь-який</option>
          <option value="junior">junior</option>
          <option value="middle">middle</option>
          <option value="senior">senior</option>
          <option value="top">top</option>
        </select>
      </label>
    </>
  );
}
