'use client';

import { submitBooking } from './submitBooking';
import { bookingAnalytics } from '@/lib/analytics';
import type { BookingActionState, Setters } from './bookingActions.types';
import type { AvailableSlotDto, LocationDto, ServiceDto } from './types';

export function bookingActions(state: BookingActionState, setters: Setters) {
  return {
    confirm: async () => {
      if (!state.location || !state.service || !state.slot) return;
      setters.setSubmitting(true);
      setters.setError('');
      try {
        const res = await submitBooking({
          ...state,
          location: state.location,
          service: state.service,
          slot: state.slot,
        });
        setters.setBookingId(res.id);
        bookingAnalytics.confirmed({
          bookingId: res.id,
          locationCode: (state.location as any).code || state.location.id,
          serviceId: state.service.id,
          barberId: state.barberId,
          bookingValue: state.service.price,
        });
        setters.setStep(6);
      } catch (err: any) {
        setters.setError('Не вдалося створити запис — спробуйте ще раз');
        bookingAnalytics.failed(err?.message || 'SUBMIT_ERROR', 'confirm');
      } finally {
        setters.setSubmitting(false);
      }
    },
    chooseLocation: (loc: LocationDto & { code?: string }) => {
      setters.setLocation(loc);
      setters.setService(null);
      setters.setSlot(null);
      setters.setBarberId('');
      setters.setReferenceSource('none');
      setters.setSelectedVariantObjectKey(null);
      setters.setUploadedPhoto(null);
      bookingAnalytics.locationSelected(loc.code || loc.id);
      setters.setStep(1);
    },
    chooseDate: (d: string) => {
      setters.setDate(d);
      setters.setSlot(null);
    },
    chooseService: (svc: ServiceDto) => {
      setters.setService(svc);
      setters.setSlot(null);
      bookingAnalytics.serviceSelected({ id: svc.id, name: svc.name, price: svc.price });
      setters.setStep(2);
    },
    chooseBarber: (id: string) => {
      setters.setBarberId(id);
      setters.setSlot(null);
      bookingAnalytics.barberSelected(id);
      setters.setStep(3);
    },
    chooseSlot: (s: AvailableSlotDto) => {
      setters.setSlot(s);
      bookingAnalytics.slotSelected(s.start);
    },
    chooseReferencePhoto: (sourceType: 'ai' | 'upload' | 'catalog') => {
      bookingAnalytics.referencePhotoAttached(sourceType);
    },
  };
}
