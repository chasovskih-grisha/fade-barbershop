'use client';

import { useEffect, useState } from 'react';
import { AlertBanner, Button, TextField } from '@fade/ui';

export interface ChannelItem {
  channel: string;
  value: string;
  sortOrder: number;
}

export default function ChannelSection({
  initialChannels,
  onSave,
  saving,
}: {
  initialChannels: ChannelItem[];
  onSave: (channels: ChannelItem[]) => Promise<void>;
  saving: boolean;
}) {
  const [channels, setChannels] = useState<ChannelItem[]>(initialChannels ?? []);

  // Sync state if initialChannels props change after async fetch
  useEffect(() => {
    setChannels(initialChannels ?? []);
  }, [initialChannels]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleAdd = () => {
    setChannels([...channels, { channel: 'telegram', value: '', sortOrder: channels.length }]);
  };

  const handleRemove = (index: number) => {
    setChannels(channels.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, step: -1 | 1) => {
    const target = index + step;
    const item = channels[index];
    const other = channels[target];
    if (!item || !other) return;
    const next = [...channels];
    next[index] = other;
    next[target] = item;
    setChannels(next.map((c, i) => ({ ...c, sortOrder: i })));
  };

  const handleChange = (index: number, field: keyof ChannelItem, val: string | number) => {
    const updated = [...channels];
    const item = updated[index];
    if (item) {
      updated[index] = { ...item, [field]: val };
      setChannels(updated);
    }
  };

  const handleSaveClick = async () => {
    setError(null);
    setNotice(null);
    try {
      await onSave(channels);
      setNotice('Канали успішно збережено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка збереження');
    }
  };

  return (
    <section aria-label="Канали локації" className="flex flex-col gap-3 rounded-card border border-line p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h4">Канали зв’язку</h2>
        <Button variant="secondary" onClick={handleAdd} disabled={saving}>
          Додати канал
        </Button>
      </div>
      {error && <AlertBanner tone="error" title="Помилка">{error}</AlertBanner>}
      {notice && <p role="status" className="text-body text-semantic-success">{notice}</p>}
      <div className="flex flex-col gap-3">
        {(channels ?? []).map((c, index) => (
          <div key={index} className="flex gap-2 items-center">
            <select
              aria-label="Тип каналу"
              className="rounded-input border border-line px-3 py-2 text-body"
              value={c.channel}
              onChange={(e) => handleChange(index, 'channel', e.target.value)}
              disabled={saving}
            >
              <option value="phone">Телефон</option>
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="viber">Viber</option>
              <option value="website">Website</option>
            </select>
            <TextField
              label="Значення каналу"
              value={c.value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
              placeholder="Значення (напр. @handle або +380...)"
              disabled={saving}
            />
            <Button
              variant="secondary"
              aria-label="Перемістити канал вище"
              onClick={() => handleMove(index, -1)}
              disabled={saving || index === 0}
            >
              ↑
            </Button>
            <Button
              variant="secondary"
              aria-label="Перемістити канал нижче"
              onClick={() => handleMove(index, 1)}
              disabled={saving || index === channels.length - 1}
            >
              ↓
            </Button>
            <Button
              variant="secondary"
              aria-label="Видалити канал"
              onClick={() => handleRemove(index)}
              disabled={saving}
            >
              Видалити
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2">
        <Button onClick={() => void handleSaveClick()} disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти канали'}
        </Button>
      </div>
    </section>
  );
}
