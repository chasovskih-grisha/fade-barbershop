'use client';

// Дії екрана 1б і parallel-кроку 2 (T-4521c). Окремо від bookingActions, щоб
// той модуль лишався в ліміті max-lines.

import type { Dispatch, SetStateAction } from 'react';
import { bookingAnalytics } from '@/lib/analytics';
import type { PartyMode } from './party-flow';
import type { AvailableSlotDto } from './types';

interface PartySetters {
  setPartyMode: Dispatch<SetStateAction<PartyMode | null>>;
  setPair: Dispatch<SetStateAction<string[]>>;
  setBarberId: Dispatch<SetStateAction<string>>;
  setSlot: Dispatch<SetStateAction<AvailableSlotDto | null>>;
  setStep: Dispatch<SetStateAction<number>>;
}

export function partyActions(setters: PartySetters) {
  return {
    /** Екран 1б: режим партії фіксується до вибору барберів. */
    chooseMode: (mode: PartyMode) => {
      setters.setPartyMode(mode);
      setters.setBarberId('');
      setters.setPair([]);
      setters.setSlot(null);
    },
    /** Крок 2 parallel: пара або «будь-які два» → екран 3. */
    choosePair: (ids: string[]) => {
      setters.setPair(ids);
      setters.setBarberId('');
      setters.setSlot(null);
      bookingAnalytics.barberSelected(ids.join(',') || 'any-two');
      setters.setStep(3);
    },
  };
}
