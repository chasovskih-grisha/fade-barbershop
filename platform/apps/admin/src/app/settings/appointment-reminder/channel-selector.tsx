'use client';

// Радіокарточки каналу нагадування (T-080): SMS клієнту або повне вимкнення.
// Явні aria-label на інпутах — надійний доступ із тестів і скрінрідерів.
import type { ReminderChannel } from './channels';

const CHANNELS: { value: ReminderChannel; label: string; hint: string }[] = [
  {
    value: 'sms',
    label: 'SMS клієнту',
    hint: 'Нагадування на номер клієнта за обраний час до початку візиту.',
  },
  {
    value: 'none',
    label: 'Вимкнено',
    hint: 'Нагадування не надсилаються; події позначаються в журналі як skipped.',
  },
];

export default function ChannelSelector({
  channel,
  saving,
  onChange,
}: {
  channel: ReminderChannel;
  saving: boolean;
  onChange: (channel: ReminderChannel) => void;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label="Канал нагадування">
      {CHANNELS.map((option) => {
        const selected = channel === option.value;
        return (
          <label
            key={option.value}
            className={`flex cursor-pointer flex-col gap-1 rounded-card border p-4 transition-colors ${
              selected
                ? 'border-accent-blue bg-interactive'
                : 'border-line bg-surface-raised hover:bg-interactive'
            }`}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="appointment-reminder-channel"
                aria-label={option.label}
                value={option.value}
                checked={selected}
                disabled={saving}
                onChange={() => onChange(option.value)}
              />
              <span className="text-body text-fg">{option.label}</span>
              {selected ? <span className="text-caption text-accent-blue">активний</span> : null}
            </span>
            <span className="pl-8 text-caption text-fg-secondary">{option.hint}</span>
          </label>
        );
      })}
    </section>
  );
}
