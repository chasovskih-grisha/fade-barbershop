// Хук логотипа локації (T-4609a): multipart PUT light/dark/variant/alt у
// публічний бакет location-brand, DELETE з підтвердження; стани saving,
// deleting, error, notice для секції «Логотип».
import { useState } from 'react';
import type { LocationLogoDto, LogoVariant } from './logo-fields';

const endpoint = (locationId: string) => `/admin/locations/${locationId}/logo`;

export function useLogo(locationId: string, initial: LocationLogoDto | null) {
  const [logo, setLogo] = useState<LocationLogoDto | null>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const upload = async (input: {
    light: File;
    dark: File | null;
    variant: LogoVariant;
    alt: string;
  }): Promise<boolean> => {
    setSaving(true);
    setError(null);
    setNotice('');
    try {
      const form = new FormData();
      form.append('variant', input.variant);
      form.append('alt', input.alt.trim());
      form.append('light', input.light);
      if (input.dark) form.append('dark', input.dark);
      const response = await fetch(endpoint(locationId), {
        method: 'PUT',
        credentials: 'include',
        body: form,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Не вдалося завантажити логотип.');
      }
      setLogo((await response.json()) as LocationLogoDto);
      setNotice('Логотип збережено');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося завантажити логотип.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (): Promise<void> => {
    setDeleting(true);
    setError(null);
    setNotice('');
    try {
      const response = await fetch(endpoint(locationId), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Не вдалося видалити логотип.');
      setLogo(null);
      setNotice('Логотип видалено');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося видалити логотип.');
    } finally {
      setDeleting(false);
    }
  };

  return { logo, saving, deleting, error, notice, upload, remove };
}
