'use client';

import { useState } from 'react';
import type { BarberPhotoDto } from './use-barbers-directory';

export interface BarberPhotoFormProps {
  initialPhoto: BarberPhotoDto | null;
  onSave: (file: File, alt: string, consent: boolean) => Promise<void>;
  onRemove: () => Promise<void>;
}

export function useBarberPhotoForm({ initialPhoto, onSave, onRemove }: BarberPhotoFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialPhoto?.url);
  const [alt, setAlt] = useState(initialPhoto?.alt ?? '');
  const [consent, setConsent] = useState(Boolean(initialPhoto?.consentAt));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const select = (selected: File): void => {
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const save = async (): Promise<void> => {
    if (!file && !initialPhoto) return setError('Оберіть файл фото');
    if (!alt.trim()) return setError('Вкажіть альтернативний текст (alt)');
    if (!consent) return setError('Необхідна згода барбера на публікацію фото (ADR 0015)');
    setError(null);
    setNotice(null);
    try {
      if (file) await onSave(file, alt, consent);
      setNotice('Фото успішно збережено');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Помилка збереження');
    }
  };

  const remove = async (): Promise<void> => {
    setError(null);
    setNotice(null);
    try {
      await onRemove();
      setFile(null);
      setPreviewUrl(undefined);
      setAlt('');
      setConsent(false);
      setNotice('Фото видалено');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Помилка видалення');
    }
  };

  return { previewUrl, alt, consent, error, notice, setAlt, setConsent, select, save, remove };
}
