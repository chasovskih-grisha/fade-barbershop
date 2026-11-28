import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import {
  createBooking,
  type BookingServiceDto,
  type BookingSlotDto,
  type CreatedBooking,
} from '../../../lib/api/booking';
import type { BarberDto } from '../../../lib/api/barbers';
import type { LocationDto } from '../../../lib/api/locations';
import { useDepositPayment } from './use-deposit-payment';

interface CheckoutSource {
  location: LocationDto | null;
  service: BookingServiceDto | null;
  barber: BarberDto | null;
  slot: BookingSlotDto | null;
  date: string;
  setError: Dispatch<SetStateAction<string | null>>;
  onCreated: (booking: CreatedBooking) => void;
  onPaid: () => void;
  onConflict: () => Promise<void> | void;
}

/** Creates the visit, then hands its deposit to the server-driven payment hook. */
export function useBookingCheckout({
  location,
  service,
  barber,
  slot,
  date,
  setError,
  onCreated,
  onPaid,
  onConflict,
}: CheckoutSource) {
  const [loading, setLoading] = useState(false);
  const deposit = useDepositPayment({ setError, onPaid });

  const confirm = useCallback(async () => {
    if (!location || !service || !slot) return;
    const barberId = barber?.id ?? slot.barbers[0];
    if (!barberId) {
      setError('Для цього слота немає вільного майстра');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await createBooking({
        locationId: location.id,
        serviceId: service.id,
        date,
        start: slot.start,
        end: slot.end,
        barberId,
      });
      deposit.start(next);
      onCreated(next);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Не вдалося створити запис';
      if (/409|conflict|зайнят/i.test(message)) await onConflict();
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, [barber, date, deposit, location, onConflict, onCreated, service, setError, slot]);

  return {
    created: deposit.created,
    payment: deposit.payment,
    loading,
    paying: deposit.loading,
    remaining: deposit.remaining,
    confirm,
    pay: deposit.pay,
    reset: deposit.reset,
  };
}
