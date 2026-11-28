'use client';
/* eslint-disable max-lines -- booking state hook keeps one state machine; split tracked in T-2500f */

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildDays, todayIso } from './dateStrip';
import { bookingAnalytics } from '@/lib/analytics';
import { readBookAgainParams } from '@/app/account/appointments/book-again';
import { useBookingData } from './useBookingData';
import { useBookAgainPrefill } from './useBookAgainPrefill';
import { bookingActions } from './bookingActions';
import { partyActions } from './partyActions';
import { pickBarber } from './barberParam';
import {
  isPartyService,
  pairCandidates,
  partyModeCards,
  partySlots,
  pairProblem,
} from './party-flow';
import type { PartyMode } from './party-flow';
import type { ReferenceSource } from './submitBooking';
import type { AvailableSlotDto, LocationDto, ServiceDto } from './types';
import type { ConfirmedBooking } from './bookingApi';

export const STEPS = [
  'Локація',
  'Послуга',
  'Барбер',
  'Слот',
  'Зачіска',
  'Підтвердження',
  'Оплата',
  'Готово',
];
export type { DayOption } from './dateStrip';
export type { ReferenceSource };

export function useBookingFlow() {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [service, setService] = useState<ServiceDto | null>(null);
  const [barberId, setBarberId] = useState('');
  // T-4521c: режим партії («батько + син») і вибрана пара барберів.
  const [partyMode, setPartyMode] = useState<PartyMode | null>(null);
  const [pair, setPair] = useState<string[]>([]);
  const [date, setDate] = useState(todayIso);
  const [slot, setSlot] = useState<AvailableSlotDto | null>(null);
  const [comment, setComment] = useState('');
  const [referenceSource, setReferenceSource] = useState<ReferenceSource>('none');
  const [selectedVariantObjectKey, setSelectedVariantObjectKey] = useState<string | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState('');
  const [deposit, setDeposit] = useState<NonNullable<ConfirmedBooking['deposit']> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const days = useMemo(buildDays, []);
  // Передзаповнення за наміром повторного запису (T-4617b): ?location&service&barber.
  const params = useMemo(
    () => readBookAgainParams(typeof window !== 'undefined' ? window.location.search : ''),
    []
  );
  // Старт воронки — рівно один раз на монтаж (перенесено з page.tsx за LOC-гейтом).
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    bookingAnalytics.started('web_direct');
  }, []);
  const data = useBookingData({ location, service, barberId, date, fulfillmentMode: partyMode });
  // T-4477b: `?barber=` приймається, лише коли барбер справді виконує послугу
  // локації; сміття й чужий id лишаються непоміченими, флоу йде звичайно.
  useEffect(() => {
    const picked = pickBarber(params.barber, data.barbers);
    if (picked) setBarberId(picked);
  }, [params.barber, data.barbers]);
  const isParty = isPartyService(service);
  const candidates = pairCandidates(data.roster, data.barbers);
  const cards = partyModeCards({
    barbers: data.roster.filter((barber) => barber.id !== '').length,
    chairs: location?.chairs,
  });
  useBookAgainPrefill({
    services: data.services,
    setLocation,
    setService,
    setStep,
  });
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
      setDeposit,
      setSubmitting,
      setError,
    }
  );
  const party = partyActions({ setPartyMode, setPair, setBarberId, setSlot, setStep });

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
    deposit,
    error,
    submitting,
    isParty,
    partyMode,
    cards,
    candidates,
    pair,
    setPair,
    pairProblem: pairProblem(pair, candidates),
    services: data.services,
    barbers: data.barbers,
    // Parallel: лишаються лише старти, де обидві ноги партії вільні (PARTY-WEB-03).
    slots: partyMode ? partySlots(data.slots, pair) : data.slots,
    loading: data.loading,
    waitlist: data.waitlist,
    onJoinWaitlist: data.joinWaitlist,
    onCancelWaitlist: data.cancelWaitlist,
    getWaitlistPosition: data.getWaitlistPosition,
    retryBarbers: data.retryBarbers,
    ...actions,
    ...party,
  };
}
