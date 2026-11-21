'use client';

import { useEffect, useState } from 'react';
import { AlertBanner, Button } from '@fade/ui';
import ChannelRow from './ChannelRow';
import { appendItem, patchItem, reorder } from './location-list-utils';

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
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setChannels(initialChannels ?? []);
  }, [initialChannels]);

  const save = async (): Promise<void> => {
    setError(null);
    setNotice(null);
    try {
      await onSave(channels);
      setNotice('Канали успішно збережено');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Помилка збереження');
    }
  };

  return (
    <section
      aria-label="Канали локації"
      className="flex flex-col gap-3 rounded-card border border-line p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h4">Канали зв’язку</h2>
        <Button
          variant="secondary"
          onClick={() => setChannels(appendItem(channels, { channel: 'telegram', value: '' }))}
          disabled={saving}
        >
          Додати канал
        </Button>
      </div>
      {error ? (
        <AlertBanner tone="error" title="Помилка">
          {error}
        </AlertBanner>
      ) : null}
      {notice ? (
        <p role="status" className="text-body text-semantic-success">
          {notice}
        </p>
      ) : null}
      <div className="flex flex-col gap-3">
        {channels.map((channel, index) => (
          <ChannelRow
            key={index}
            channel={channel}
            index={index}
            total={channels.length}
            saving={saving}
            onChange={(field, value) => setChannels(patchItem(channels, index, { [field]: value }))}
            onMove={(step) => setChannels(reorder(channels, index, step))}
            onRemove={() => setChannels(channels.filter((_, position) => position !== index))}
          />
        ))}
      </div>
      <div className="flex gap-3 mt-2">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти канали'}
        </Button>
      </div>
    </section>
  );
}
