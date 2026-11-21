'use client';

// Секція «Фото» на картці барбера (T-4610a): завантаження з обов'язковою згодою (ADR 0015).

import { AlertBanner, Button, PhotoUpload, TextField } from '@fade/ui';
import type { BarberPhotoDto } from './use-barbers-directory';
import { useBarberPhotoForm } from './use-barber-photo-form';

interface Props {
  barberId: string;
  initialPhoto: BarberPhotoDto | null;
  onSave: (file: File, alt: string, consent: boolean) => Promise<void>;
  onRemove: () => Promise<void>;
  saving: boolean;
}

export default function BarberPhotoSection({ initialPhoto, onSave, onRemove, saving }: Props) {
  const { previewUrl, alt, consent, error, notice, setAlt, setConsent, select, save, remove } =
    useBarberPhotoForm({ initialPhoto, onSave, onRemove });

  return (
    <section
      aria-label="Фото барбера"
      className="flex flex-col gap-3 rounded-card border border-line p-4"
    >
      <h3 className="font-display text-h5">Фото барбера</h3>
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
      {initialPhoto ? (
        <p className="text-caption text-fg-secondary">
          Оновлено: {new Date(initialPhoto.updatedAt).toLocaleDateString('uk-UA')}
        </p>
      ) : null}
      <PhotoUpload
        label="Завантажити фото"
        previewUrl={previewUrl}
        consent={consent}
        onConsentChange={setConsent}
        consentLabel="Підтверджую отримання згоди барбера на публікацію фото"
        onSelect={select}
        disabled={saving}
      />
      <TextField
        label="Альтернативний текст (alt)"
        value={alt}
        onChange={(event) => setAlt(event.target.value)}
        placeholder="Опис фото для скринрідера"
        disabled={saving}
      />
      <div className="flex gap-3 mt-2">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти фото'}
        </Button>
        {initialPhoto ? (
          <Button variant="secondary" onClick={() => void remove()} disabled={saving}>
            Видалити фото
          </Button>
        ) : null}
      </div>
    </section>
  );
}
