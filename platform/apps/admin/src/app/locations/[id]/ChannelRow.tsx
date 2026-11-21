'use client';

import { Button, TextField } from '@fade/ui';
import type { ChannelItem } from './ChannelSection';

const CHANNEL_TYPES = [
  { value: 'phone', label: 'Телефон' },
  { value: 'email', label: 'Email' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'viber', label: 'Viber' },
  { value: 'website', label: 'Website' },
];

export default function ChannelRow({
  channel,
  index,
  total,
  saving,
  onChange,
  onMove,
  onRemove,
}: {
  channel: ChannelItem;
  index: number;
  total: number;
  saving: boolean;
  onChange: (field: 'channel' | 'value', value: string) => void;
  onMove: (step: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <select
        aria-label="Тип каналу"
        className="rounded-input border border-line px-3 py-2 text-body"
        value={channel.channel}
        onChange={(event) => onChange('channel', event.target.value)}
        disabled={saving}
      >
        {CHANNEL_TYPES.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <TextField
        label="Значення каналу"
        value={channel.value}
        onChange={(event) => onChange('value', event.target.value)}
        placeholder="Значення (напр. @handle або +380...)"
        disabled={saving}
      />
      <Button
        variant="secondary"
        aria-label="Перемістити канал вище"
        onClick={() => onMove(-1)}
        disabled={saving || index === 0}
      >
        ↑
      </Button>
      <Button
        variant="secondary"
        aria-label="Перемістити канал нижче"
        onClick={() => onMove(1)}
        disabled={saving || index === total - 1}
      >
        ↓
      </Button>
      <Button variant="secondary" aria-label="Видалити канал" onClick={onRemove} disabled={saving}>
        Видалити
      </Button>
    </div>
  );
}
