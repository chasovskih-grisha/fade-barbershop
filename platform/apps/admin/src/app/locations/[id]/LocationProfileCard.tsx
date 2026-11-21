import ProfileSection from './ProfileSection';
import type { LocationEditViewProps } from './location-edit-types';

export default function LocationProfileCard({
  location,
  onSaveProfile,
  saving,
}: Pick<LocationEditViewProps, 'location' | 'onSaveProfile' | 'saving'>) {
  return (
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
  );
}
