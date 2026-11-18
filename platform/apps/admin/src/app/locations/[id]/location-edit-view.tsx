'use client';

// Розмітка редагування локації: статус, години, повідомлення. Логіка — у page.
import { AlertBanner, Badge, Button, type ToastTone } from '@fade/ui';
import { HoursFieldset } from '../location-hours-fields';
import type { DayHours } from '../HoursEditor';
import SlotPolicySection from './SlotPolicySection';
import LogoSection from './LogoSection';
import ChannelSection, { type ChannelItem } from './ChannelSection';
import PhotoSection, { type PhotoItem } from './PhotoSection';
import ProfileSection, { type ProfileValues } from './ProfileSection';
import ChairsSection, { type ChairItem } from './ChairsSection';
import InactiveLocationBanner from './InactiveLocationBanner';
import type { LocationLogoDto } from './logo-fields';

export interface LocationDto {
  id: string;
  code: string;
  name: string;
  address: string;
  addressParts?: {
    street: string;
    building: string;
    city: string;
    postalCode?: string;
    country?: string;
  } | null;
  lat?: number;
  lng?: number;
  phone: string | null;
  active: boolean;
  hours: DayHours[];
  logo: LocationLogoDto | null;
  chairs?: ChairItem[];
  channels?: ChannelItem[];
  photos?: PhotoItem[];
}

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
}: {
  location: LocationDto;
  hours: DayHours[];
  onHoursChange: (hours: DayHours[]) => void;
  saving: boolean;
  error: string | null;
  notice: { text: string; tone: ToastTone } | null;
  onSaveHours: () => void;
  onToggleActive: () => void;
  onBack: () => void;
  onLogoSave: () => void;
  onLogoRemove: () => void;
  onSaveChannels: (channels: ChannelItem[]) => Promise<void>;
  onSavePhotos: (photos: PhotoItem[]) => Promise<void>;
  onSaveProfile: (values: ProfileValues) => Promise<void>;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-h3">{location.name}</h1>
        <Badge tone={location.active ? 'success' : 'neutral'}>
          {location.active ? 'Активна' : 'Неактивна'}
        </Badge>
      </div>
      <p className="text-body text-fg-secondary">
        {location.code} · {location.address}
        {location.phone ? ` · ${location.phone}` : ''}
      </p>
      <InactiveLocationBanner active={location.active} />

      {notice && (
        <p
          role="status"
          className={notice.tone === 'success' ? 'text-semantic-success' : 'text-fg-secondary'}
        >
          {notice.text}
        </p>
      )}
      {error && (
        <AlertBanner tone="error" title="Помилка">
          {error}
        </AlertBanner>
      )}

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

      <div className="flex flex-col gap-2 rounded-card border border-line p-4">
        <h2 className="font-display text-h4">Статус локації</h2>
        <p className="text-body text-fg-muted">
          Неактивна локація не з’являється на сайті й не приймає записів.
        </p>
        <Button variant={location.active ? 'secondary' : 'primary'} onClick={onToggleActive}>
          {location.active ? 'Деактивувати локацію' : 'Активувати локацію'}
        </Button>
      </div>

      <ChannelSection
        initialChannels={location.channels ?? []}
        onSave={onSaveChannels}
        saving={saving}
      />

      <PhotoSection initialPhotos={location.photos ?? []} onSave={onSavePhotos} saving={saving} />

      <ProfileSection
        initial={{
          name: location.name,
          lat: location.lat ?? 50.4501,
          lng: location.lng ?? 30.5234,
          addressParts: location.addressParts ?? {
            street: '',
            building: '',
            city: '',
            postalCode: '',
            country: 'UA',
          },
        }}
        onSave={onSaveProfile}
        saving={saving}
      />

      <LogoSection
        locationId={location.id}
        logo={location.logo}
        onSave={onLogoSave}
        onRemove={onLogoRemove}
      />

      <SlotPolicySection locationId={location.id} />
    </div>
  );
}
