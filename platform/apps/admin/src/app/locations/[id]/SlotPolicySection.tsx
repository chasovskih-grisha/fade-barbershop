'use client';

// Розділ «Політика слотів» на сторінці локації (T-4522): number-поля форм,
// валідація діапазонів, confirm-banner «лише до нових записів» перед збереженням.
import { AlertBanner, Button, TextField } from '@fade/ui';
import { POLICY_FIELDS } from './slot-policy-fields';
import { useSlotPolicy } from './use-slot-policy';

export default function SlotPolicySection({ locationId }: { locationId: string }) {
  const policy = useSlotPolicy(locationId);
  return (
    <section
      aria-label="Політика слотів"
      className="flex flex-col gap-3 rounded-card border border-line p-4"
    >
      <h2 className="font-display text-h4">Політика слотів</h2>
      <p className="text-body text-fg-muted">
        {policy.usingDefaults ? 'Діють дефолтні значення (15/0/14/60). ' : ''}
        Крок сітки, буфер між записами, горизонт запису та поріг «останньої хвилини».
      </p>
      {policy.error && (
        <AlertBanner tone="error" title="Помилка">
          {policy.error}
        </AlertBanner>
      )}
      {policy.notice && (
        <p role="status" className="text-body text-semantic-success">
          {policy.notice}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {POLICY_FIELDS.map(({ field, label, help, min, max, multipleOf }) => (
          <TextField
            key={field}
            label={label}
            help={help}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={multipleOf ?? 1}
            value={Number.isFinite(policy.values[field]) ? policy.values[field] : ''}
            onChange={(event) => policy.setField(field, Number(event.target.value))}
          />
        ))}
      </div>
      {policy.confirming && (
        <AlertBanner
          tone="info"
          title="Підтвердіть зміну"
          action={{ label: 'Зберегти', onClick: () => void policy.confirmSave() }}
        >
          Зміна застосується лише до нових записів: чинні візити не зміняться.
        </AlertBanner>
      )}
      <div className="flex gap-3">
        <Button onClick={policy.requestSave} disabled={policy.saving || policy.confirming}>
          {policy.saving ? 'Збереження…' : 'Зберегти політику'}
        </Button>
        {policy.confirming && (
          <Button variant="secondary" onClick={policy.cancel} disabled={policy.saving}>
            Скасувати
          </Button>
        )}
      </div>
    </section>
  );
}
