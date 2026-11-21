'use client';

import { useState } from 'react';
import { AlertBanner, Button } from '@fade/ui';
import PhotoRow from './PhotoRow';
import { appendItem, patchItem, reorder } from './location-list-utils';

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

  const save = async (): Promise<void> => {
    setError(null);
    setNotice(null);
    try {
      await onSave(photos);
      setNotice('Галерею успішно збережено');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Помилка збереження');
    }
  };

  return (
    <section
      aria-label="Галерея локації"
      className="flex flex-col gap-3 rounded-card border border-line p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h4">Галерея локації</h2>
        <Button
          variant="secondary"
          onClick={() => setPhotos(appendItem(photos, { url: '', caption: '' }))}
          disabled={saving}
        >
          Додати фото
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
        {photos.map((photo, index) => (
          <PhotoRow
            key={index}
            photo={photo}
            index={index}
            total={photos.length}
            saving={saving}
            onChange={(field, value) => setPhotos(patchItem(photos, index, { [field]: value }))}
            onMove={(step) => setPhotos(reorder(photos, index, step))}
            onRemove={() => setPhotos(photos.filter((_, position) => position !== index))}
          />
        ))}
      </div>
      <div className="flex gap-3 mt-2">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти галерею'}
        </Button>
      </div>
    </section>
  );
}
