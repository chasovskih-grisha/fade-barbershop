'use client';

// Радіокарточки каналу підтвердження: email/sms/both/none. Явні aria-label
// на інпутах — надійний доступ із тестів і скрінрідерів (label обгортає
// картку, але текст розмитий по вкладених span).
import type { Channel } from './channels';

const CHANNELS: { value: Channel; label: string; hint: string }[] = [
  {
    value: 'email',
    label: 'Email',
    hint: 'Лист «офісу запису» — на email локації. Потрібен email у локації (MNG-ADM-01).',
  },
  {
    value: 'sms',
    label: 'SMS клієнту',
    hint: 'Повідомлення на номер клієнта запису. У dev SMS летить у Mailpit (sms.dev).',
  },
  {
    value: 'both',
    label: 'Email + SMS',
    hint: 'Обидва канали; якщо одержувача немає — підтвердження пропускається з записом у журналі.',
  },
  {
    value: 'none',
    label: 'Вимкнено',
    hint: 'Підтвердження не надсилаються; події позначаються у журналі як skipped.',
  },
];

export default function ChannelSelector({
  channel,
  saving,
  onChange,
}: {
  channel: Channel;
  saving: boolean;
  onChange: (channel: Channel) => void;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label="Канал підтвердження">
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
                name="booking-confirmation-channel"
                aria-label={option.label}
                value={option.value}
                checked={selected}
                disabled={saving}
                onChange={() => onChange(option.value)}
                className="accent-accent-blue"
              />
              <span className="font-semibold text-h4">{option.label}</span>
              {selected && <span className="text-sm text-accent-blue">активний</span>}
            </span>
            <span className="pl-8 text-sm text-fg-secondary">{option.hint}</span>
          </label>
        );
      })}
    </section>
  );
}
