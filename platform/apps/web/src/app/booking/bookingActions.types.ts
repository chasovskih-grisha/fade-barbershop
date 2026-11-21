import type { Dispatch, SetStateAction } from 'react';
import type { ReferenceSource } from './submitBooking';
import type { AvailableSlotDto, LocationDto, ServiceDto } from './types';

export type Setters = {
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
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string>>;
};

export interface BookingActionState {
  location: LocationDto | null;
  service: ServiceDto | null;
  slot: AvailableSlotDto | null;
  date: string;
  barberId: string;
  comment: string;
  referenceSource: ReferenceSource;
  selectedVariantObjectKey: string | null;
}
