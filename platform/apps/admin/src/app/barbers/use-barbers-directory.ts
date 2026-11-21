// Хук довідника барберів (MNG-ADM-04…06): завантаження з локаціями,
// створення, активація/деактивація, керування фото.

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createBarber,
  loadDirectory,
  removeBarberPhoto,
  saveBarberPhoto,
  toggleBarber,
  type BarberPhotoUpload,
} from './barbers-directory-api';
import type { Barber, BarbersLocation } from './barbers-directory.types';

export type { Barber, BarbersLocation, BarberPhotoDto } from './barbers-directory.types';

export function useBarbersDirectory() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [locations, setLocations] = useState<BarbersLocation[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const snapshot = await loadDirectory();
    setBarbers(snapshot.barbers);
    setLocations(snapshot.locations);
  }, []);

  useEffect(() => {
    void reload().catch(() => setError('Не вдалося завантажити персонал'));
  }, [reload]);

  const create = async (name: string, phone: string, onDone: () => void): Promise<void> => {
    setError('');
    setSaving(true);
    try {
      if (!(await createBarber(name, phone))) {
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
      if (!(await toggleBarber(barber))) {
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

  const savePhoto = async (upload: BarberPhotoUpload): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      if (!(await saveBarberPhoto(upload))) throw new Error('Не вдалося зберегти фото');
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = async (barberId: string): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      if (!(await removeBarberPhoto(barberId))) throw new Error('Не вдалося видалити фото');
      await reload();
    } finally {
      setSaving(false);
    }
  };

  return { barbers, locations, error, saving, create, toggle, savePhoto, removePhoto };
}
