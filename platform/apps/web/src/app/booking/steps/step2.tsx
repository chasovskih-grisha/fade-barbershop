'use client';

// Крок 2 (T-4521c): пакет спершу показує режим (екран 1б), parallel — вибір
// пари барберів, решта послуг — звичайний список (booking-flow.md §Екран 2).

import BarberStep from './BarberStep';
import BarberPairStep from './BarberPairStep';
import PartyModeStep from './PartyModeStep';
import { togglePair } from '../party-flow';
import type { useBookingFlow } from '../useBookingFlow';

type Flow = ReturnType<typeof useBookingFlow>;

export default function Step2({ flow }: { flow: Flow }) {
  if (flow.isParty && flow.partyMode === null) {
    // prettier-ignore
    return <PartyModeStep cards={flow.cards} onBack={() => flow.setStep(1)} onNext={flow.chooseMode} />;
  }
  if (flow.partyMode === 'parallel') {
    // prettier-ignore
    return <BarberPairStep candidates={flow.candidates} selected={flow.pair} problem={flow.pairProblem} onToggle={(id) => flow.setPair(togglePair(flow.pair, id))} onAny={() => flow.setPair([])} onBack={() => flow.chooseMode('sequential')} onNext={() => flow.choosePair(flow.pair)} />;
  }
  // prettier-ignore
  return <BarberStep barbers={flow.barbers} loading={flow.loading} error={flow.error} onBack={() => flow.setStep(1)} onSelect={flow.chooseBarber} retryBarbers={flow.retryBarbers} />;
}
