'use client';

// Редагування локації (MNG-ADM-02): логіка — use-location-edit, розмітка —
// location-edit-view. Раніше кнопка «Редагувати» зі списку вела на
// неіснуючий маршрут — 404.
import { useRouter } from 'next/navigation';
import { AlertBanner, Skeleton } from '@fade/ui';
import LocationEditView from './location-edit-view';
import { useLocationEdit } from './use-location-edit';

export default function EditLocationPage() {
  const router = useRouter();
  const edit = useLocationEdit();

  if (edit.loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Skeleton variant="rect" className="h-10 w-64" />
        <Skeleton variant="rect" className="h-72" />
      </div>
    );
  }

  if (edit.loadError || !edit.location) {
    return (
      <div className="mx-auto max-w-2xl">
        <AlertBanner
          tone="error"
          title="Помилка"
          action={{ label: 'До списку локацій', onClick: () => router.push('/locations') }}
        >
          Локацію не знайдено.
        </AlertBanner>
      </div>
    );
  }

  return (
    <LocationEditView
      location={edit.location}
      hours={edit.hours}
      onHoursChange={edit.setHours}
      saving={edit.saving}
      error={edit.error}
      notice={edit.notice}
      onSaveHours={() => void edit.saveHours()}
      onToggleActive={() => void edit.toggleActive()}
      onBack={() => router.push('/locations')}
      onLogoSave={() => void edit.invalidateAndReload()}
      onLogoRemove={() => void edit.invalidateAndReload()}
      onSaveChannels={edit.saveChannels}
      onSavePhotos={edit.savePhotos}
      onSaveProfile={edit.saveProfile}
    />
  );
}
