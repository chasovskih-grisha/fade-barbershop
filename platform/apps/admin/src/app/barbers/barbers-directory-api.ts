import type { Barber, BarbersLocation } from './barbers-directory.types';

export interface DirectorySnapshot {
  barbers: Barber[];
  locations: BarbersLocation[];
}

export async function loadDirectory(): Promise<DirectorySnapshot> {
  const [staffResponse, locationsResponse] = await Promise.all([
    fetch('/admin/barbers', { credentials: 'include' }),
    fetch('/admin/locations', { credentials: 'include' }),
  ]);
  if (!staffResponse.ok || !locationsResponse.ok) throw new Error('Не вдалося завантажити дані');
  return {
    barbers: (await staffResponse.json()) as Barber[],
    locations: (await locationsResponse.json()) as BarbersLocation[],
  };
}

export async function createBarber(name: string, phone: string): Promise<boolean> {
  const response = await fetch('/admin/barbers', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone }),
  });
  return response.ok;
}

export async function toggleBarber(barber: { id: string; active: boolean }): Promise<boolean> {
  const action = barber.active ? 'deactivate' : 'activate';
  const response = await fetch(`/admin/barbers/${barber.id}/${action}`, {
    method: 'POST',
    credentials: 'include',
  });
  return response.ok;
}

export interface BarberPhotoUpload {
  barberId: string;
  file: File;
  alt: string;
  consent: boolean;
}

export async function saveBarberPhoto(upload: BarberPhotoUpload): Promise<boolean> {
  const data = new FormData();
  data.append('file', upload.file);
  data.append('alt', upload.alt);
  data.append('consent', String(upload.consent));
  const response = await fetch(`/admin/barbers/${upload.barberId}/photo`, {
    method: 'PUT',
    credentials: 'include',
    body: data,
  });
  return response.ok;
}

export async function removeBarberPhoto(barberId: string): Promise<boolean> {
  const response = await fetch(`/admin/barbers/${barberId}/photo`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return response.ok;
}
