'use client';
// Редактор графіка барбера за локацією; логіка — use-availability.ts.
import { useState } from 'react';
import { Button } from '@fade/ui';
import { AvailabilityDayRow } from './AvailabilityDayRow';
import { useAvailability } from './use-availability';

const DAYS = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя'];

export default function AvailabilityEditor({
  barberId,
  locations,
}: {
  barberId: string;
  locations: { id: string; name: string }[];
}) {
  const [locationId, setLocationId] = useState('');
  const { windows, error, setError, update, save } = useAvailability(barberId, locationId);

  const onSave = async () => {
    const message = await save();
    setError(message ?? '');
  };

  return (
    <section className="mt-3 rounded-card border border-line p-3">
      <label>
        Графік для
        <select
          aria-label={`Локація графіка ${barberId}`}
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          className="ml-2 rounded-input border-line bg-surface-base p-2"
        >
          <option value="">Оберіть локацію</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      {locationId && (
        <div className="mt-3 space-y-2">
          {DAYS.map((day, dayOfWeek) => (
            <AvailabilityDayRow
              key={day}
              day={day}
              dayOfWeek={dayOfWeek}
              windows={windows}
              onUpdate={update}
            />
          ))}
          <Button variant="secondary" size="md" onClick={() => void onSave()}>
            Зберегти графік
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2">
          {error}
        </p>
      )}
    </section>
  );
}
