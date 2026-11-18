// Хук довідника барберів (MNG-ADM-04…06): завантаження з локаціями,
// створення, активація/деактивація, керування фото.

import { useEffect, useState } from 'react';

export interface BarberPhotoDto {
  url: string;
  alt: string;
  consentAt: string | null;
  consentBy: string | null;
  updatedAt: string;
}

export interface Barber {
  id: string;
  name: string | null;
  phone: string;
  active: boolean;
  selfSchedule: boolean;
  photo: BarberPhotoDto | null;
}
export interface BarbersLocation {
  id: string;
  name: string;
}

export function useBarbersDirectory() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [locations, setLocations] = useState<BarbersLocation[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    const [staffResponse, locationsResponse] = await Promise.all([
      fetch('/admin/barbers', { credentials: 'include' }),
      fetch('/admin/locations', { credentials: 'include' }),
    ]);
    if (!staffResponse.ok || !locationsResponse.ok) throw new Error('Не вдалося завантажити дані');
    setBarbers((await staffResponse.json()) as Barber[]);
    setLocations((await locationsResponse.json()) as BarbersLocation[]);
  };

  useEffect(() => {
    void reload().catch(() => setError('Не вдалося завантажити персонал'));
  }, []);

  const create = async (name: string, phone: string, onDone: () => void) => {
    setError('');
    setSaving(true);
    try {
      const response = await fetch('/admin/barbers', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      if (!response.ok) {
        setError('Перевірте ім’я та номер телефону');
        return;
      }
      onDone();
      await reload();
    } catch {
      setError('Не вдалося створити барбера');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (barber: { id: string; active: boolean }): Promise<boolean> => {
    setError('');
    try {
      const action = barber.active ? 'deactivate' : 'activate';
      const response = await fetch(`/admin/barbers/${barber.id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        setError('Не вдалося змінити статус барбера');
        return false;
      }
      await reload();
      return true;
    } catch {
      setError('Не вдалося змінити статус барбера');
      return false;
    }
  };

  const savePhoto = async (barberId: string, file: File, alt: string, consent: boolean) => {
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('alt', alt);
      data.append('consent', String(consent));

      const response = await fetch(`/admin/barbers/${barberId}/photo`, {
        method: 'PUT',
        credentials: 'include',
        body: data,
      });
      if (!response.ok) {
        throw new Error('Не вдалося зберегти фото');
      }
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = async (barberId: string) => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/admin/barbers/${barberId}/photo`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Не вдалося видалити фото');
      }
      await reload();
    } finally {
      setSaving(false);
    }
  };

  return { barbers, locations, error, saving, create, toggle, savePhoto, removePhoto };
}
