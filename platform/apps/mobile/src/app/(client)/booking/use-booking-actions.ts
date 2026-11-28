import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { BarberDto } from '../../../lib/api/barbers';
import type { BookingServiceDto } from '../../../lib/api/booking';
import type { Step } from './booking-step';

interface ActionSource {
  step: Step;
  setStep: Dispatch<SetStateAction<Step>>;
  setService: Dispatch<SetStateAction<BookingServiceDto | null>>;
  setBarber: Dispatch<SetStateAction<BarberDto | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  date: string;
  loadSlots: (date?: string, barber?: BarberDto | null) => Promise<void>;
  clearSlot: () => void;
  back: () => void;
}

export function useBookingActions(source: ActionSource) {
  const chooseService = (next: BookingServiceDto) => {
    source.setService(next);
    source.setBarber(null);
    source.setError(null);
    source.setStep('barber');
  };

  const chooseBarber = (next: BarberDto | null) => {
    source.setBarber(next);
    source.setStep('slot');
    void source.loadSlots(source.date, next);
  };

  const goBack = () => {
    if (source.step === 'barber') source.setStep('service');
    else if (source.step === 'slot') source.setStep('barber');
    else if (source.step === 'confirm') source.setStep('slot');
    else source.back();
  };

  const chooseAnother = (resetCheckout: () => void) => {
    resetCheckout();
    source.clearSlot();
    source.setStep('slot');
    source.setError(null);
    void source.loadSlots(source.date);
  };

  const handleConflict = async () => {
    source.setStep('slot');
    source.clearSlot();
    await source.loadSlots(source.date);
    source.setError('Цей час щойно зайняли. Оберіть інший слот.');
  };

  return { chooseService, chooseBarber, goBack, chooseAnother, handleConflict };
}

export function usePreselectBarber(
  barbers: BarberDto[],
  barberId: string | undefined,
  setBarber: Dispatch<SetStateAction<BarberDto | null>>
) {
  useEffect(() => {
    if (!barberId || barbers.length === 0) return;
    setBarber(barbers.find((item) => item.id === barberId) ?? null);
  }, [barbers, barberId, setBarber]);
}
