'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildDays, todayIso } from './dateStrip';
import { bookingAnalytics } from '@/lib/analytics';
import { useBookingData } from './useBookingData';
import { bookingActions } from './bookingActions';
import type { ReferenceSource } from './submitBooking';
import type { AvailableSlotDto, LocationDto, ServiceDto } from './types';

// Export step constants
export const STEPS = ['Локація', 'Послуга', 'Барбер', 'Слот', 'Зачіска', 'Підтвердження', 'Готово'];
export const QUICK_STEPS = ['Послуга', 'Барбер', 'Слот', 'Телефон', 'Підтвердження'];
export type { DayOption } from './dateStrip';
export type { ReferenceSource };

// Persisted UTM state (accessible from page)
let persistedUtm: { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string } = {};
export function getPersistedUtm() {
  return persistedUtm;
}
export function setPersistedUtm(utm: { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string }) {
  persistedUtm = utm;
}

export function useBookingFlow(quick = false) {
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
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const days = useMemo(buildDays, []);
  // Support pre-selecting barber from URL search params (e.g. ?barber=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const bParam = params.get('barber');
      if (bParam) {
        setBarberId(bParam);
      }
      // Quick booking: support ?service=... param
      const sParam = params.get('service');
      if (sParam && quick) {
        // Service selection is handled via step navigation
      }
    }
  }, [quick]);
  // Старт воронки — рівно один раз на монтаж (перенесено з page.tsx за LOC-гейтом).
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const entryPoint = quick ? 'quick_booking' : 'web_direct';
    bookingAnalytics.started(entryPoint);
  }, []);
  // Quick booking: parse and persist UTM params on entry
  useEffect(() => {
    if (quick && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const utm: { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string } = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
        const val = urlParams.get(key);
        if (val) utm[key] = val;
      });
      // Store UTM if not already persisted or if this is a new session
      if (Object.keys(utm).length > 0) {
        // Check if we already have persisted UTM with same source
        if (!persistedUtm.utm_source || persistedUtm.utm_source !== utm.utm_source) {
          setPersistedUtm(utm);
        }
      }
    }
  }, [quick]);
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
    phone,
    setPhone,
    otp,
    setOtp,
    quick,
  };
}