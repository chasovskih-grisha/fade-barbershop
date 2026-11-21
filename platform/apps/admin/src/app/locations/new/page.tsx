'use client';

// Створення локації (MNG-ADM-01): POST /admin/locations.
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertBanner } from '@fade/ui';
import LocationFormFields, { type LocationFormValues } from './location-form-fields';
import LocationMapPicker from '../LocationMapPicker';
import type { AddressPartsValue } from '../location-geocode-client';
import { defaultWeek, HoursFieldset } from '../location-hours-fields';
import type { DayHours } from '../HoursEditor';
import NewLocationActions from './NewLocationActions';
import { createLocation, EMPTY_ADDRESS_PARTS, EMPTY_LOCATION_VALUES } from '../location-create-api';

export default function NewLocationPage() {
  const router = useRouter();
  const [values, setValues] = useState<LocationFormValues>(EMPTY_LOCATION_VALUES);
  const [addressParts, setAddressParts] = useState<AddressPartsValue>(EMPTY_ADDRESS_PARTS);
  const [hours, setHours] = useState<DayHours[]>(defaultWeek);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createLocation({ values, addressParts, hours });
      router.push('/locations');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося створити локацію');
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-h3">Нова локація</h1>
      <form
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-4"
        aria-label="Створення локації"
      >
        <LocationFormFields
          values={values}
          onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
        />
        <LocationMapPicker
          lat={Number(values.lat) || 50.4501}
          lng={Number(values.lng) || 30.5234}
          onChange={(lat, lng) =>
            setValues((current) => ({ ...current, lat: String(lat), lng: String(lng) }))
          }
          onAddressParts={setAddressParts}
          disabled={saving}
        />
        <HoursFieldset hours={hours} onChange={setHours} />
        {error ? (
          <AlertBanner tone="error" title="Локація">
            {error}
          </AlertBanner>
        ) : null}
        <NewLocationActions saving={saving} onCancel={() => router.push('/locations')} />
      </form>
    </div>
  );
}
