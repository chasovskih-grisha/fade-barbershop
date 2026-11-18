// Хук редагування локації (MNG-ADM-02, T-4406): завантаження, збереження годин, каналів, галереї,
// активація/деактивація. Відокремлений від розмітки за LOC-гейтом (ADR 0019).
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { ToastTone } from '@fade/ui';
import { defaultWeek, sortedWeek } from '../location-hours-fields';
import type { LocationDto } from './location-edit-view';
import type { DayHours } from '../HoursEditor';
import type { ChannelItem } from './ChannelSection';
import type { PhotoItem } from './PhotoSection';
import type { ProfileValues } from './ProfileSection';
import { reloadLocation } from './reload-location';
import {
  saveHoursAction,
  saveChannelsAction,
  savePhotosAction,
  saveProfileAction,
  toggleActiveAction,
} from './location-edit-actions';

export function useLocationEdit() {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [hours, setHours] = useState<DayHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: ToastTone } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (id: string) => {
    const response = await fetch(`/admin/locations/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error('failed');
    const data = (await response.json()) as LocationDto;
    setLocation(data);
    setHours(sortedWeek(data.hours.length ? data.hours : defaultWeek()));
  }, []);

  useEffect(() => {
    const id = params?.id ?? '';
    if (!id) return;
    void load(id)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [load, params?.id]);

  const deps = {
    location,
    hours,
    setSaving,
    setError,
    setNotice,
    setLocation: (loc: LocationDto) => setLocation(loc),
  };

  const saveHours = () => saveHoursAction(deps);
  const saveChannels = (channels: ChannelItem[]) => saveChannelsAction(deps, channels);
  const savePhotos = (photos: PhotoItem[]) => savePhotosAction(deps, photos);
  const saveProfile = (values: ProfileValues) => saveProfileAction(deps, values);
  const toggleActive = () => toggleActiveAction(deps);
  const invalidateAndReload = () => reloadLocation({ location, setLocation, setNotice, setError });

  return {
    location,
    hours,
    setHours,
    loading,
    loadError,
    error,
    notice,
    saving,
    saveHours,
    saveChannels,
    savePhotos,
    saveProfile,
    toggleActive,
    invalidateAndReload,
  };
}
