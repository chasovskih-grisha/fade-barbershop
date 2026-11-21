'use client';

import { useState } from 'react';
import { listSlots } from './bookingApi';
import { cancellable, noopCleanup } from './cancellable';
import type { WaitlistInfo, UseWaitlistInput } from './useWaitlist.types';

export type { WaitlistInfo } from './useWaitlist.types';

export function useWaitlist({
  location,
  service,
  barberId,
  date,
  setLoading,
  setError,
}: UseWaitlistInput) {
  const [waitlist, setWaitlist] = useState<WaitlistInfo>({});

  const joinWaitlist = () => {
    if (!location || !service) return noopCleanup;
    let cancelled = false;
    setLoading(true);
    listSlots({
      locationId: location.id,
      date,
      serviceId: service.id,
      ...(barberId ? { barberId } : {}),
    })
      .then(() => {
        // Slots exist - don't join waitlist; user can pick a slot instead
      })
      .catch(async () => {
        // No slots available - join waitlist
        const result = await fetch('/booking/waitlist/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId: location.id, serviceId: service.id, barberId }),
        }).then((r) => r.json());
        if (!cancelled) {
          setWaitlist({
            entryId: result.entryId,
            queuePosition: result.queuePosition,
            estimatedWaitMinutes: result.estimatedWaitMinutes,
          });
          setError('');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  };

  const cancelWaitlist = () => {
    if (!waitlist.entryId) return noopCleanup;
    return cancellable(
      fetch('/booking/waitlist/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: waitlist.entryId }),
      }).then(() => undefined),
      {
        onSuccess: () => {
          setWaitlist({});
          setError('');
        },
        onError: () => setError('Не вдалося скасувати запис на waitlist'),
        setLoading,
      }
    );
  };

  const getWaitlistPosition = () => {
    if (!waitlist.entryId) return noopCleanup;
    return cancellable(
      fetch('/booking/waitlist/position/' + waitlist.entryId).then((r) => r.json()) as Promise<{
        queuePosition: number;
        estimatedWaitMinutes: number;
      }>,
      {
        onSuccess: (result) =>
          setWaitlist({
            ...waitlist,
            queuePosition: result.queuePosition,
            estimatedWaitMinutes: result.estimatedWaitMinutes,
          }),
        onError: () => setError('Не вдалося отримати позицію в черзі'),
      }
    );
  };

  return {
    waitlist,
    setWaitlist,
    joinWaitlist,
    cancelWaitlist,
    getWaitlistPosition,
  };
}
