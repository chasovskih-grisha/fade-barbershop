'use client';

// Селектор «за N годин до візиту» (T-080): показуємо години, у API летять
// хвилини (leadMinutes). Поточне значення завжди є серед опцій — навіть якщо
// воно поза пресетами, селектор не спотворює чинне налаштування.
import { hoursLabel, hoursOf, hourOptions } from './hour-options';

const LEAD_FIELD_ID = 'appointment-reminder-lead';

export default function LeadTimeSelector({
  leadMinutes,
  saving,
  onChange,
}: {
  leadMinutes: number;
  saving: boolean;
  onChange: (leadMinutes: number) => void;
}) {
  return (
    <section className="flex flex-col gap-2" aria-label="Час нагадування">
      <label htmlFor={LEAD_FIELD_ID} className="text-body text-fg">
        За скільки годин до візиту
      </label>
      <select
        id={LEAD_FIELD_ID}
        value={hoursOf(leadMinutes)}
        disabled={saving}
        onChange={(event) => onChange(Number(event.target.value) * 60)}
        className="h-11 w-fit rounded-input border border-line bg-surface-raised px-3 text-body text-fg"
      >
        {hourOptions(leadMinutes).map((hours) => (
          <option key={hours} value={hours}>
            {hoursLabel(hours)}
          </option>
        ))}
      </select>
      <p className="text-caption text-fg-secondary">
        Нагадування піде рівно за цей час до початку візиту.
      </p>
    </section>
  );
}
