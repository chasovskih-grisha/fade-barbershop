'use client';

import { Button, TextField } from '@fade/ui';
import type { PhotoItem } from './PhotoSection';

export default function PhotoRow({
  photo,
  index,
  total,
  saving,
  onChange,
  onMove,
  onRemove,
}: {
  photo: PhotoItem;
  index: number;
  total: number;
  saving: boolean;
  onChange: (field: 'url' | 'caption', value: string) => void;
  onMove: (step: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <TextField
        label="URL фото"
        value={photo.url}
        onChange={(event) => onChange('url', event.target.value)}
        placeholder="https://..."
        disabled={saving}
      />
      <TextField
        label="Підпис фото"
        value={photo.caption ?? ''}
        onChange={(event) => onChange('caption', event.target.value)}
        placeholder="Підпис"
        disabled={saving}
      />
      <Button
        variant="secondary"
        aria-label="Перемістити фото вище"
        onClick={() => onMove(-1)}
        disabled={saving || index === 0}
      >
        ↑
      </Button>
      <Button
        variant="secondary"
        aria-label="Перемістити фото нижче"
        onClick={() => onMove(1)}
        disabled={saving || index === total - 1}
      >
        ↓
      </Button>
      <Button variant="secondary" aria-label="Видалити фото" onClick={onRemove} disabled={saving}>
        Видалити
      </Button>
    </div>
  );
}
