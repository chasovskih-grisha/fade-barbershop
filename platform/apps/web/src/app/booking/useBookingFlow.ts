'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildDays, todayIso } from './dateStrip';
import { bookingAnalytics } from '@/lib/analytics';
import { useBookingData } from './useBookingData';
import { bookingActions } from './bookingActions';
import type { ReferenceSource } from './submitBooking';
import type { AvailableSlotDto, LocationDto, ServiceDto } from './types';

export const STEPS = ['Локація', 'Послуга', 'Барбер', 'Слот', 'Зачіска', 'Підтвердження', 'Готово'];
export type { DayOption } from './dateStrip';
export type { ReferenceSource };

export function useBookingFlow() {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [service, setService] = useState<ServiceDto | null>(null);
  const [barberId, setBarberId] = useState('');
  const [date, setDate] = useState(todayIso);
  const [slot, setSlot] = useState<AvailableSlotDto | null>(null);
  const [comment, setComment] = useState('');
  const [referenceSource, setReferenceSource] = useState<ReferenceSource>('none');
  const [selectedVariantObjectKey, setSelectedVariantObjectKey] = useState<string | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const days = useMemo(buildDays, []);
  // Support pre-selecting barber from URL search params (e.g. ?barber=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const bParam = params.get('barber');
      if (bParam) {
        setBarberId(bParam);
      }
    }
  }, []);
  // Старт воронки — рівно один раз на монтаж (перенесено з page.tsx за LOC-гейтом).
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    bookingAnalytics.started('web_direct');
  }, []);
  const data = useBookingData({ location, service, barberId, date });
  const actions = bookingActions(
    { location, service, slot, date, barberId, comment, referenceSource, selectedVariantObjectKey },
    {
      setStep,
      setLocation,
      setService,
      setBarberId,
      setDate,
      setSlot,
      setReferenceSource,
      setSelectedVariantObjectKey,
      setUploadedPhoto,
      setBookingId,
      setSubmitting,
      setError,
    }
  );

  return {
    step,
    setStep,
    days,
    date,
    location,
    service,
    barberId,
    slot,
    comment,
    setComment,
    referenceSource,
    setReferenceSource,
    selectedVariantObjectKey,
    setSelectedVariantObjectKey,
    uploadedPhoto,
    setUploadedPhoto,
    bookingId,
    error,
    submitting,
    services: data.services,
    barbers: data.barbers,
    slots: data.slots,
    loading: data.loading,
    waitlist: data.waitlist,
    onJoinWaitlist: data.joinWaitlist,
    onCancelWaitlist: data.cancelWaitlist,
    getWaitlistPosition: data.getWaitlistPosition,
    retryBarbers: data.retryBarbers,
    ...actions,
  };
}
