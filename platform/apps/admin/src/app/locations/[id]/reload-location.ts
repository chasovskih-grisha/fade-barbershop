import type { ToastTone } from '@fade/ui';
import type { LocationDto } from './location-edit-view';

export async function reloadLocation(args: {
  location: LocationDto | null;
  setLocation: (value: LocationDto) => void;
  setNotice: (value: { text: string; tone: ToastTone }) => void;
  setError: (value: string) => void;
}) {
  if (!args.location) return;
  try {
    const response = await fetch(`/admin/locations/${args.location.id}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('failed');
    args.setLocation((await response.json()) as LocationDto);
    args.setNotice({ text: 'Дані локації оновлено', tone: 'success' });
  } catch {
    args.setError('Не вдалося оновити дані локації');
  }
}
