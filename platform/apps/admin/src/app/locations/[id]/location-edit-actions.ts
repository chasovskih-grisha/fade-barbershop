import type { ToastTone } from '@fade/ui';
import { sortedWeek, validateHours } from '../location-hours-fields';
import type { LocationDto } from './location-edit-view';
import type { DayHours } from '../HoursEditor';
import type { ChannelItem } from './ChannelSection';
import type { PhotoItem } from './PhotoSection';
import type { ProfileValues } from './ProfileSection';

interface Deps {
  location: LocationDto | null;
  hours: DayHours[];
  setSaving: (v: boolean) => void;
  setError: (v: string | null) => void;
  setNotice: (n: { text: string; tone: ToastTone } | null) => void;
  setLocation: (l: LocationDto) => void;
}

export async function saveHoursAction(d: Deps) {
  if (!d.location) return;
  d.setError(null);
  const err = validateHours(d.hours);
  if (err) { d.setError(err); return; }
  d.setSaving(true);
  try {
    const res = await fetch(`/admin/locations/${d.location.id}`, {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: sortedWeek(d.hours) }),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(b?.message ?? 'Не вдалося зберегти години.');
    }
    d.setNotice({ text: 'Години роботи збережено', tone: 'success' });
  } catch (c) {
    d.setError(c instanceof Error ? c.message : 'Не вдалося зберегти години.');
  } finally { d.setSaving(false); }
}

export async function saveChannelsAction(d: Deps, channels: ChannelItem[]) {
  if (!d.location) return;
  d.setSaving(true);
  try {
    const res = await fetch(`/admin/locations/${d.location.id}`, {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channels }),
    });
    if (!res.ok) throw new Error('Не вдалося зберегти канали.');
    d.setNotice({ text: 'Канали збережено', tone: 'success' });
  } finally { d.setSaving(false); }
}

export async function savePhotosAction(d: Deps, photos: PhotoItem[]) {
  if (!d.location) return;
  d.setSaving(true);
  try {
    const res = await fetch(`/admin/locations/${d.location.id}`, {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos }),
    });
    if (!res.ok) throw new Error('Не вдалося зберегти галерею.');
    d.setNotice({ text: 'Галерею збережено', tone: 'success' });
  } finally { d.setSaving(false); }
}

export async function saveProfileAction(d: Deps, values: ProfileValues) {
  if (!d.location) return;
  d.setSaving(true);
  d.setError(null);
  try {
    const res = await fetch(`/admin/locations/${d.location.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name,
        addressParts: values.addressParts,
        lat: values.lat,
        lng: values.lng,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message ?? 'Не вдалося зберегти профіль.');
    }
    const updated = (await res.json().catch(() => null)) as { id?: string } | null;
    if (updated?.id) {
      d.setLocation({ ...d.location, name: values.name, address: values.addressParts.street });
    }
    d.setNotice({ text: 'Профіль локації збережено', tone: 'success' });
  } catch (cause) {
    d.setError(cause instanceof Error ? cause.message : 'Не вдалося зберегти профіль.');
  } finally {
    d.setSaving(false);
  }
}

export async function toggleActiveAction(d: Deps) {
  if (!d.location) return;
  d.setError(null);
  const act = d.location.active ? 'disable' : 'enable';
  try {
    const res = await fetch(`/admin/locations/${d.location.id}/${act}`, { method: 'POST', credentials: 'include' });
    if (!res.ok) throw new Error('failed');
    d.setLocation({ ...d.location, active: !d.location.active });
    d.setNotice({
      text: act === 'disable' ? 'Локацію деактивовано' : 'Локацію активовано',
      tone: act === 'disable' ? 'info' : 'success',
    });
  } catch { d.setError('Не вдалося змінити статус локації'); }
}
