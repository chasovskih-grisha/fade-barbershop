import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import {
  fetchBookingSlots,
  todayInKyiv,
  type BookingServiceDto,
  type BookingSlotDto,
} from '../../../lib/api/booking';
import type { BarberDto } from '../../../lib/api/barbers';
import type { LocationDto } from '../../../lib/api/locations';
import { isBookableDate } from '../../../lib/booking-date';

interface SlotSource {
  location: LocationDto | null;
  service: BookingServiceDto | null;
  barber: BarberDto | null;
  setError: Dispatch<SetStateAction<string | null>>;
}

/** Server-owned availability for the selected service, barber and date. */
export function useBookingSlots({ location, service, barber, setError }: SlotSource) {
  const [date, setDate] = useState(todayInKyiv());
  const [dateError, setDateError] = useState<string | null>(null);
  const [slots, setSlots] = useState<BookingSlotDto[]>([]);
  const [slot, setSlot] = useState<BookingSlotDto | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSlots = useCallback(
    async (nextDate = date, nextBarber: BarberDto | null = barber) => {
      if (!location || !service) return;
      if (!isBookableDate(nextDate, todayInKyiv())) {
        setSlots([]);
        setSlot(null);
        setDateError('Вкажіть коректну дату у форматі рррр-мм-дд');
        return;
      }
      setDateError(null);
      setLoading(true);
      setError(null);
      try {
        const list = await fetchBookingSlots({
          locationId: location.id,
          date: nextDate,
          serviceId: service.id,
          ...(nextBarber ? { barberId: nextBarber.id } : {}),
        });
        setSlots(list);
        setSlot(null);
      } catch (reason) {
        setSlots([]);
        setError(reason instanceof Error ? reason.message : 'Не вдалося завантажити слоти');
      } finally {
        setLoading(false);
      }
    },
    [barber, date, location, service, setError]
  );

  const changeDate = useCallback((value: string) => {
    setDate(value);
    setDateError(null);
  }, []);

  return {
    date,
    dateError,
    slots,
    slot,
    loading,
    changeDate,
    loadSlots,
    setSlot,
    clearSlot: () => setSlot(null),
  };
}
