'use client';

// Розмітка редагування локації: статус, години, повідомлення. Логіка — у page.
import { Button } from '@fade/ui';
import { HoursFieldset } from '../location-hours-fields';
import SlotPolicySection from './SlotPolicySection';
import LogoSection from './LogoSection';
import ChannelSection from './ChannelSection';
import PhotoSection from './PhotoSection';
import ChairsSection from './ChairsSection';
import SpecialDatesSection from './SpecialDatesSection';
import LocationHeader from './LocationHeader';
import LocationProfileCard from './LocationProfileCard';
import LocationStatusCard from './LocationStatusCard';
import type { LocationEditViewProps } from './location-edit-types';

export type { LocationDto, LocationEditViewProps } from './location-edit-types';

export default function LocationEditView({
  location,
  hours,
  onHoursChange,
  saving,
  error,
  notice,
  onSaveHours,
  onToggleActive,
  onBack,
  onLogoSave,
  onLogoRemove,
  onSaveChannels,
  onSavePhotos,
  onSaveProfile,
}: LocationEditViewProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <LocationHeader location={location} error={error} notice={notice} />
      <HoursFieldset hours={hours} onChange={onHoursChange} />
      <div className="flex gap-3">
        <Button onClick={onSaveHours} disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти години'}
        </Button>
        <Button variant="secondary" onClick={onBack} disabled={saving}>
          До списку
        </Button>
      </div>

      <ChairsSection chairs={location.chairs} />
      <SpecialDatesSection exceptions={location.specialDates} />
      <LocationStatusCard location={location} onToggleActive={onToggleActive} />

      <ChannelSection
        initialChannels={location.channels ?? []}
        onSave={onSaveChannels}
        saving={saving}
      />
      <PhotoSection initialPhotos={location.photos ?? []} onSave={onSavePhotos} saving={saving} />
      <LocationProfileCard location={location} onSaveProfile={onSaveProfile} saving={saving} />

      <LogoSection
        locationId={location.id}
        logo={location.logo}
        onSave={onLogoSave}
        onRemove={onLogoRemove}
      />
      <SlotPolicySection locationId={location.id} hours={hours} />
    </div>
  );
}
