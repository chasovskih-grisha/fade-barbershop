// Факти піна (T-4711b): чиста логіка «що показувати і куди веде чіп», окремо від
// розмітки. Факт показуємо лише тоді, коли клієнт справді його обрав; факт
// поточного кроку — текст, а не кнопка.
import type { PartyMode } from './party-flow';
import type { AvailableSlotDto, BarberDto, LocationDto, ServiceDto } from './types';

export interface SummaryFact {
  key: string;
  name: string;
  value: string;
  /** Крок, на який веде чіп; немає — факт незмінний на цьому кроці. */
  target?: number;
}

export interface SummaryState {
  step: number;
  location: LocationDto | null;
  service: ServiceDto | null;
  barbers: BarberDto[];
  barberId: string;
  slot: AvailableSlotDto | null;
  partyMode: PartyMode | null;
}

const MODE_LABEL: Record<PartyMode, string> = {
  sequential: 'По черзі',
  parallel: 'Одночасно',
};

const edit = (step: number, at: number) => (step > at ? { target: at } : {});

function serviceFacts(service: ServiceDto | null, step: number): SummaryFact[] {
  if (!service) return [];
  const value = `${service.name}, ${service.duration} хв, ${service.price} ₴`;
  return [{ key: 'service', name: 'послугу', value, ...edit(step, 1) }];
}

function barberFacts({ step, barbers, barberId }: SummaryState): SummaryFact[] {
  if (step < 3) return [];
  const name = barbers.find((barber) => barber.id === barberId)?.name;
  const value = barberId ? (name ?? 'Обраний барбер') : 'Будь-який барбер';
  return [{ key: 'barber', name: 'барбера', value, ...edit(step, 2) }];
}

function slotFacts(slot: AvailableSlotDto | null, step: number): SummaryFact[] {
  if (!slot) return [];
  const value = `${slot.start}–${slot.end}`;
  return [{ key: 'slot', name: 'час', value, ...edit(step, 3) }];
}

export function summaryFacts(state: SummaryState): SummaryFact[] {
  const { step, location, service, partyMode } = state;
  if (!location) return [];
  return [
    { key: 'location', name: 'локацію', value: location.name, target: 0 },
    ...serviceFacts(service, step),
    ...(partyMode ? [{ key: 'mode', name: 'режим', value: MODE_LABEL[partyMode] }] : []),
    ...barberFacts(state),
    ...slotFacts(state.slot, step),
  ];
}
