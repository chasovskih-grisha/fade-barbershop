'use client';

// Створення локації (MNG-ADM-01): POST /admin/locations. Раніше кнопка
// «Додати локацію» вела на неіснуючий маршрут — 404 при живому API.
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertBanner, Button } from '@fade/ui';
import LocationFormFields, { type LocationFormValues } from './location-form-fields';
import LocationMapPicker from '../LocationMapPicker';
import type { AddressPartsValue } from '../location-geocode-client';
import { defaultWeek, validateHours, HoursFieldset } from '../location-hours-fields';
import type { DayHours } from '../HoursEditor';

const KYIV_CENTER = { lat: '50.4501', lng: '30.5234' };

export default function NewLocationPage() {
  const router = useRouter();
  const [values, setValues] = useState<LocationFormValues>({
    code: '',
    name: '',
    address: '',
    lat: KYIV_CENTER.lat,
    lng: KYIV_CENTER.lng,
    phone: '',
  });
  const [addressParts, setAddressParts] = useState<AddressPartsValue>({
    street: '',
    building: '',
    city: '',
    country: 'UA',
  });
  const [hours, setHours] = useState<DayHours[]>(defaultWeek);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const hoursError = validateHours(hours);
    if (hoursError) {
      setError(hoursError);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/admin/locations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: values.code.trim(),
          name: values.name.trim(),
          address: values.address.trim(),
          addressParts:
            addressParts.street.trim() && addressParts.building.trim() && addressParts.city.trim()
              ? addressParts
              : undefined,
          lat: Number(values.lat),
          lng: Number(values.lng),
          ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
          hours,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Не вдалося створити локацію');
      }
      router.push('/locations');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося створити локацію');
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-h3">Нова локація</h1>
      <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Створення локації">
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

        {error && (
          <AlertBanner tone="error" title="Локація">
            {error}
          </AlertBanner>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Створення…' : 'Створити локацію'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/locations')}
            disabled={saving}
          >
            Скасувати
          </Button>
        </div>
      </form>
    </div>
  );
}
