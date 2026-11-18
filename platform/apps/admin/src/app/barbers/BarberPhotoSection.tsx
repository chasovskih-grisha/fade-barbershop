'use client';

// Секція «Фото» на картці барбера (T-4610a): завантаження з обов'язковою згодою (ADR 0015).

import { useState } from 'react';
import { AlertBanner, Button, PhotoUpload, TextField } from '@fade/ui';
import type { BarberPhotoDto } from './use-barbers-directory';

interface Props {
  barberId: string;
  initialPhoto: BarberPhotoDto | null;
  onSave: (file: File, alt: string, consent: boolean) => Promise<void>;
  onRemove: () => Promise<void>;
  saving: boolean;
}

export default function BarberPhotoSection({ initialPhoto, onSave, onRemove, saving }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialPhoto?.url ?? undefined);
  const [alt, setAlt] = useState(initialPhoto?.alt ?? '');
  const [consent, setConsent] = useState(Boolean(initialPhoto?.consentAt));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSave = async () => {
    if (!file && !initialPhoto) {
      setError('Оберіть файл фото');
      return;
    }
    if (!alt.trim()) {
      setError('Вкажіть альтернативний текст (alt)');
      return;
    }
    if (!consent) {
      setError('Необхідна згода барбера на публікацію фото (ADR 0015)');
      return;
    }
    setError(null);
    setNotice(null);
    try {
      if (file) {
        await onSave(file, alt, consent);
      }
      setNotice('Фото успішно збережено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка збереження');
    }
  };

  const handleRemoveClick = async () => {
    setError(null);
    setNotice(null);
    try {
      await onRemove();
      setFile(null);
      setPreviewUrl(undefined);
      setAlt('');
      setConsent(false);
      setNotice('Фото видалено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка видалення');
    }
  };

  return (
    <section
      aria-label="Фото барбера"
      className="flex flex-col gap-3 rounded-card border border-line p-4"
    >
      <h3 className="font-display text-h5">Фото барбера</h3>
      {error && (
        <AlertBanner tone="error" title="Помилка">
          {error}
        </AlertBanner>
      )}
      {notice && (
        <p role="status" className="text-body text-semantic-success">
          {notice}
        </p>
      )}
      {initialPhoto && (
        <p className="text-caption text-fg-secondary">
          Оновлено: {new Date(initialPhoto.updatedAt).toLocaleDateString('uk-UA')}
        </p>
      )}
      <PhotoUpload
        label="Завантажити фото"
        previewUrl={previewUrl}
        consent={consent}
        onConsentChange={setConsent}
        consentLabel="Підтверджую отримання згоди барбера на публікацію фото"
        onSelect={(selected) => {
          setFile(selected);
          setPreviewUrl(URL.createObjectURL(selected));
        }}
        disabled={saving}
      />
      <TextField
        label="Альтернативний текст (alt)"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        placeholder="Опис фото для скринрідера"
        disabled={saving}
      />
      <div className="flex gap-3 mt-2">
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти фото'}
        </Button>
        {initialPhoto && (
          <Button variant="secondary" onClick={() => void handleRemoveClick()} disabled={saving}>
            Видалити фото
          </Button>
        )}
      </div>
    </section>
  );
}
