'use client';

// Профіль локації в адмінці (MNG-ADM-01, T-4405): структурована адреса +
// точка на карті. Display-рядок `address` рахує сервер через Address.formatted().
import { useState } from 'react';
import { AlertBanner, Button, TextField } from '@fade/ui';
import LocationMapPicker from '../LocationMapPicker';
import type { AddressPartsValue } from '../location-geocode-client';

export interface ProfileValues {
  name: string;
  lat: number;
  lng: number;
  addressParts: AddressPartsValue;
}

export default function ProfileSection({
  initial,
  onSave,
  saving,
}: {
  initial: ProfileValues;
  onSave: (values: ProfileValues) => Promise<void>;
  saving: boolean;
}) {
  const [values, setValues] = useState<ProfileValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const patchParts = (patch: Partial<AddressPartsValue>) =>
    setValues((current) => ({
      ...current,
      addressParts: { ...current.addressParts, ...patch },
    }));

  const save = async () => {
    setError(null);
    setNotice(null);
    try {
      await onSave(values);
      setNotice('Профіль локації збережено');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося зберегти профіль.');
    }
  };

  const parts = values.addressParts;
  return (
    <section aria-label="Профіль локації" className="flex flex-col gap-3 rounded-card border border-line p-4">
      <h2 className="font-display text-h4">Профіль і адреса</h2>
      {error && <AlertBanner tone="error" title="Помилка">{error}</AlertBanner>}
      {notice && <p role="status" className="text-body text-semantic-success">{notice}</p>}

      <TextField
        label="Назва"
        value={values.name}
        onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
        disabled={saving}
      />
      <LocationMapPicker
        lat={values.lat}
        lng={values.lng}
        onChange={(lat, lng) => setValues((current) => ({ ...current, lat, lng }))}
        onAddressParts={patchParts}
        disabled={saving}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Вулиця"
          value={parts.street}
          onChange={(event) => patchParts({ street: event.target.value })}
          disabled={saving}
        />
        <TextField
          label="Будинок"
          value={parts.building}
          onChange={(event) => patchParts({ building: event.target.value })}
          disabled={saving}
        />
        <TextField
          label="Місто"
          value={parts.city}
          onChange={(event) => patchParts({ city: event.target.value })}
          disabled={saving}
        />
        <TextField
          label="Індекс (необов’язково)"
          value={parts.postalCode ?? ''}
          onChange={(event) => patchParts({ postalCode: event.target.value })}
          disabled={saving}
        />
      </div>
      <div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти профіль'}
        </Button>
      </div>
    </section>
  );
}
