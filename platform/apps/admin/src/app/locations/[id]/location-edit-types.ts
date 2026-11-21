import type { ToastTone } from '@fade/ui';
import type { DayHours } from '../HoursEditor';
import type { LocationLogoDto } from './logo-fields';
import type { ChannelItem } from './ChannelSection';
import type { PhotoItem } from './PhotoSection';
import type { ProfileValues } from './ProfileSection';
import type { ChairItem } from './ChairsSection';
import type { SpecialDateItem } from './SpecialDatesSection';

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
  specialDates?: SpecialDateItem[];
  channels?: ChannelItem[];
  photos?: PhotoItem[];
}

export interface LocationEditViewProps {
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
}
