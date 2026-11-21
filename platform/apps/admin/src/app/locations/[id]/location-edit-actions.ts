import { errorMessage, patchLocation, type Deps } from './location-edit-deps';
import { sortedWeek, validateHours } from '../location-hours-fields';
import type { ChannelItem } from './ChannelSection';
import type { PhotoItem } from './PhotoSection';
import type { ProfileValues } from './ProfileSection';

export async function saveHoursAction(d: Deps): Promise<void> {
  if (!d.location) return;
  d.setError(null);
  const error = validateHours(d.hours);
  if (error) {
    d.setError(error);
    return;
  }
  d.setSaving(true);
  try {
    const response = await patchLocation(d.location.id, { hours: sortedWeek(d.hours) });
    if (!response.ok) throw new Error(await errorMessage(response, 'Не вдалося зберегти години.'));
    d.setNotice({ text: 'Години роботи збережено', tone: 'success' });
  } catch (cause) {
    d.setError(cause instanceof Error ? cause.message : 'Не вдалося зберегти години.');
  } finally {
    d.setSaving(false);
  }
}

export async function saveChannelsAction(d: Deps, channels: ChannelItem[]): Promise<void> {
  if (!d.location) return;
  d.setSaving(true);
  try {
    const response = await patchLocation(d.location.id, { channels });
    if (!response.ok) throw new Error('Не вдалося зберегти канали.');
    d.setNotice({ text: 'Канали збережено', tone: 'success' });
  } finally {
    d.setSaving(false);
  }
}

export async function savePhotosAction(d: Deps, photos: PhotoItem[]): Promise<void> {
  if (!d.location) return;
  d.setSaving(true);
  try {
    const response = await patchLocation(d.location.id, { photos });
    if (!response.ok) throw new Error('Не вдалося зберегти галерею.');
    d.setNotice({ text: 'Галерею збережено', tone: 'success' });
  } finally {
    d.setSaving(false);
  }
}

export async function saveProfileAction(d: Deps, values: ProfileValues): Promise<void> {
  if (!d.location) return;
  d.setSaving(true);
  d.setError(null);
  try {
    const response = await patchLocation(d.location.id, {
      name: values.name,
      addressParts: values.addressParts,
      lat: values.lat,
      lng: values.lng,
    });
    if (!response.ok) throw new Error(await errorMessage(response, 'Не вдалося зберегти профіль.'));
    d.setLocation({ ...d.location, name: values.name, address: values.addressParts.street });
    d.setNotice({ text: 'Профіль локації збережено', tone: 'success' });
  } catch (cause) {
    d.setError(cause instanceof Error ? cause.message : 'Не вдалося зберегти профіль.');
  } finally {
    d.setSaving(false);
  }
}

export async function toggleActiveAction(d: Deps): Promise<void> {
  if (!d.location) return;
  d.setError(null);
  const action = d.location.active ? 'disable' : 'enable';
  try {
    const response = await fetch(`/admin/locations/${d.location.id}/${action}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('failed');
    d.setLocation({ ...d.location, active: !d.location.active });
    d.setNotice({
      text: action === 'disable' ? 'Локацію деактивовано' : 'Локацію активовано',
      tone: action === 'disable' ? 'info' : 'success',
    });
  } catch {
    d.setError('Не вдалося змінити статус локації');
  }
}
