'use client';

import { useState } from 'react';
import { AlertBanner, Button, TextField } from '@fade/ui';

export interface PhotoItem {
  url: string;
  caption: string | null;
  sortOrder: number;
}

export default function PhotoSection({
  initialPhotos,
  onSave,
  saving,
}: {
  initialPhotos: PhotoItem[];
  onSave: (photos: PhotoItem[]) => Promise<void>;
  saving: boolean;
}) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos ?? []);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleAdd = () => {
    setPhotos([...photos, { url: '', caption: '', sortOrder: photos.length }]);
  };

  const handleRemove = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, step: -1 | 1) => {
    const target = index + step;
    const item = photos[index];
    const other = photos[target];
    if (!item || !other) return;
    const next = [...photos];
    next[index] = other;
    next[target] = item;
    setPhotos(next.map((p, i) => ({ ...p, sortOrder: i })));
  };

  const handleChange = (index: number, field: keyof PhotoItem, val: string | number) => {
    const updated = [...photos];
    const item = updated[index];
    if (item) {
      updated[index] = { ...item, [field]: val };
      setPhotos(updated);
    }
  };

  const handleSaveClick = async () => {
    setError(null);
    setNotice(null);
    try {
      await onSave(photos);
      setNotice('Галерею успішно збережено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка збереження');
    }
  };

  return (
    <section aria-label="Галерея локації" className="flex flex-col gap-3 rounded-card border border-line p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h4">Галерея локації</h2>
        <Button variant="secondary" onClick={handleAdd} disabled={saving}>
          Додати фото
        </Button>
      </div>
      {error && <AlertBanner tone="error" title="Помилка">{error}</AlertBanner>}
      {notice && <p role="status" className="text-body text-semantic-success">{notice}</p>}
      <div className="flex flex-col gap-3">
        {(photos ?? []).map((p, index) => (
          <div key={index} className="flex gap-2 items-center">
            <TextField
              label="URL фото"
              value={p.url}
              onChange={(e) => handleChange(index, 'url', e.target.value)}
              placeholder="https://..."
              disabled={saving}
            />
            <TextField
              label="Підпис фото"
              value={p.caption ?? ''}
              onChange={(e) => handleChange(index, 'caption', e.target.value)}
              placeholder="Підпис"
              disabled={saving}
            />
            <Button
              variant="secondary"
              aria-label="Перемістити фото вище"
              onClick={() => handleMove(index, -1)}
              disabled={saving || index === 0}
            >
              ↑
            </Button>
            <Button
              variant="secondary"
              aria-label="Перемістити фото нижче"
              onClick={() => handleMove(index, 1)}
              disabled={saving || index === photos.length - 1}
            >
              ↓
            </Button>
            <Button
              variant="secondary"
              aria-label="Видалити фото"
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
          {saving ? 'Збереження…' : 'Зберегти галерею'}
        </Button>
      </div>
    </section>
  );
}
