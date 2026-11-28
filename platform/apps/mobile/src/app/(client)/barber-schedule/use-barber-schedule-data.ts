// T-4616b: дані екрана «не вийду» — локації барбера і право редагування.
// Локації приходять із сервера (`GET /barber/schedule`), тож екран не вгадує
// `locationId`; `canEdit` — прапорець selfSchedule (SCH-001).
import { useEffect, useState } from 'react';
import { useSession } from '../../../lib/session-store';
import {
  getBarberSchedule,
  getBarberScheduleLocations,
  type BarberScheduleLocation,
} from '../../../lib/api/barber-self-schedule';

export interface BarberScheduleData {
  token: string | null;
  signedOut: boolean;
  loading: boolean;
  failed: boolean;
  canEdit: boolean;
  locations: BarberScheduleLocation[];
  locationId: string;
  selectLocation: (id: string) => void;
}

export function useBarberScheduleData(): BarberScheduleData {
  const session = useSession();
  const token = session?.accessToken ?? null;
  const [locations, setLocations] = useState<BarberScheduleLocation[]>([]);
  const [locationId, setLocationId] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    getBarberScheduleLocations(token)
      .then((result) => {
        if (!active) return;
        setLocations(result.locations);
        setLocationId((current) => current || (result.locations[0]?.id ?? ''));
      })
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !locationId) return;
    let active = true;
    getBarberSchedule(locationId, token)
      .then((view) => active && setCanEdit(view.canEdit))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [token, locationId]);

  return {
    token,
    signedOut: !token,
    loading,
    failed,
    canEdit,
    locations,
    locationId,
    selectLocation: setLocationId,
  };
}
