'use client';

import type { Dispatch, SetStateAction } from 'react';
import { submitBooking } from './submitBooking';
import type { ReferenceSource } from './submitBooking';
import type { AvailableSlotDto, LocationDto, ServiceDto } from './types';
import { bookingAnalytics } from '@/lib/analytics';
import type { ConfirmedBooking } from './bookingApi';

type Setters = {
  setStep: Dispatch<SetStateAction<number>>;
  setLocation: Dispatch<SetStateAction<LocationDto | null>>;
  setService: Dispatch<SetStateAction<ServiceDto | null>>;
  setBarberId: Dispatch<SetStateAction<string>>;
  setDate: Dispatch<SetStateAction<string>>;
  setSlot: Dispatch<SetStateAction<AvailableSlotDto | null>>;
  setReferenceSource: Dispatch<SetStateAction<ReferenceSource>>;
  setSelectedVariantObjectKey: Dispatch<SetStateAction<string | null>>;
  setUploadedPhoto: Dispatch<SetStateAction<string | null>>;
  setBookingId: Dispatch<SetStateAction<string>>;
  setDeposit: Dispatch<SetStateAction<NonNullable<ConfirmedBooking['deposit']> | null>>;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string>>;
};

export function bookingActions(
  state: {
    location: LocationDto | null;
    service: ServiceDto | null;
    slot: AvailableSlotDto | null;
    date: string;
    barberId: string;
    comment: string;
    referenceSource: ReferenceSource;
    selectedVariantObjectKey: string | null;
  },
  setters: Setters
) {
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
        setters.setDeposit(res.deposit ?? null);
        bookingAnalytics.confirmed({
          bookingId: res.id,
          locationCode: (state.location as any).code || state.location.id,
          serviceId: state.service.id,
          barberId: state.barberId,
          bookingValue: state.service.price,
        });
        setters.setStep(res.deposit ? 6 : 7);
      } catch (err: any) {
        setters.setError('Не вдалося створити запис — спробуйте ще раз');
        bookingAnalytics.failed(err?.message || 'SUBMIT_ERROR', 'confirm');
      } finally {
        setters.setSubmitting(false);
      }
    },
    chooseLocation: (loc: LocationDto) => {
      setters.setLocation(loc);
      setters.setService(null);
      setters.setSlot(null);
      setters.setBarberId('');
      setters.setReferenceSource('none');
      setters.setSelectedVariantObjectKey(null);
      setters.setUploadedPhoto(null);
      bookingAnalytics.locationSelected((loc as any).code || loc.id);
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
