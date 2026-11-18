'use client';

// Матриця «послуги барбера» (T-4521b): чекбокси послуг обраної локації.
// Порожня матриця = барбер робить усі послуги (дефолт «всі»), перше зняття
// чекбокса переводить локацію в режим «лише обрані».
import { useEffect, useState } from 'react';
import { Checkbox } from '@fade/ui';
import {
  assignedServiceIds,
  locationServices,
  toggleService,
  type MatrixService,
} from './barber-matrix-data';

type Location = { id: string; name: string };

export default function BarberServiceMatrixEditor({
  barberId,
  locations,
}: {
  barberId: string;
  locations: Location[];
}) {
  const [locationId, setLocationId] = useState('');
  const [services, setServices] = useState<MatrixService[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!locationId) {
      setLoaded(false);
      return;
    }
    setLoaded(false);
    setError('');
    Promise.all([locationServices(locationId), assignedServiceIds(barberId, locationId)])
      .then(([catalog, rows]) => {
        setServices(catalog);
        setAssigned(rows);
        setLoaded(true);
      })
      .catch(() => setError('Не вдалося завантажити матрицю послуг'));
  }, [locationId, barberId]);

  const isChecked = (serviceId: string) => (assigned.size > 0 ? assigned.has(serviceId) : true); // fallback «усі»

  const onToggle = (serviceId: string, makeIt: boolean) => {
    if (busy || !locationId) return;
    setBusy(true);
    setError('');
    toggleService({ barberId, locationId, serviceId, services, assigned, makeIt })
      .then((next) => setAssigned(next))
      .catch(() => setError('Не вдалося оновити матрицю'))
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-h4">Послуги барбера</h3>
      <p className="text-body text-fg-muted">
        Які послуги виконує барбер на локації: порожній список = усі послуги.
      </p>
      <label className="text-body">
        Локація
        <select
          aria-label={`Локація матриці барбера ${barberId}`}
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
      {error && (
        <p role="alert" className="text-caption text-semantic-danger">
          {error}
        </p>
      )}
      {locationId && loaded && services.length === 0 && (
        <p className="text-body text-fg-muted">На цій локації немає активних послуг.</p>
      )}
      {locationId && loaded && services.length > 0 && (
        <div className="flex flex-col gap-2" role="group" aria-label="Послуги локації">
          {services.map((service) => (
            <Checkbox
              key={service.id}
              label={service.name}
              checked={isChecked(service.id)}
              disabled={busy}
              onChange={(event) => onToggle(service.id, event.target.checked)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
