'use client';

import { useEffect, useState } from 'react';
import { Button } from '@fade/ui';

type Location = { id: string; name: string };
type Assignment = { id: string; barberId: string };

export default function StaffAssignmentEditor({
  barberId,
  locations,
}: {
  barberId: string;
  locations: Location[];
}) {
  const [locationId, setLocationId] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState('');
  const refresh = async (id: string) => {
    const response = await fetch(`/admin/locations/${id}/staff`, { credentials: 'include' });
    if (!response.ok) throw new Error('Не вдалося завантажити призначення');
    setAssignments(await response.json());
  };

  useEffect(() => {
    if (locationId)
      void refresh(locationId).catch(() => setError('Не вдалося завантажити призначення'));
  }, [locationId]);

  const mine = assignments.find((item) => item.barberId === barberId);
  async function change(method: 'POST' | 'DELETE') {
    setError('');
    const url = `/admin/locations/${locationId}/staff${method === 'DELETE' ? `/${mine?.id}` : ''}`;
    const response = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...(method === 'POST' ? { body: JSON.stringify({ barberId }) } : {}),
    });
    if (!response.ok) {
      setError('Не вдалося змінити призначення');
      return;
    }
    await refresh(locationId);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label>
        Локація
        <select
          aria-label={`Локація барбера ${barberId}`}
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
        <>
          <span>{mine ? 'Призначений' : 'Не призначений'}</span>
          <Button
            variant="secondary"
            size="md"
            disabled={mine !== undefined}
            onClick={() => void change('POST')}
          >
            Призначити
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled={!mine}
            onClick={() => void change('DELETE')}
          >
            Зняти
          </Button>
        </>
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
