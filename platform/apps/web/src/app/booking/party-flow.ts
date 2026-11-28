// Флоу «батько + син» (T-4521c): екран 1б і parallel-крок 2 поверх чинного
// booking-flow. Чиста логіка без React: режими, кандидати в пару й слоти, де
// обидві ноги партії справді вільні.

import type { AvailableSlotDto, BarberDto, ServiceDto } from './types';

export type PartyMode = 'sequential' | 'parallel';

/** Матриця «барбер × послуга» в адмінці — куди веде пара з нульовим перетином. */
export const MATRIX_HREF = '/admin/barbers';

/** Пакетна послуга має паралельну тривалість у каталозі («Батько + син»). */
export function isPartyService(service: ServiceDto | null): boolean {
  return typeof service?.parallelDuration === 'number';
}

export interface ModeCard {
  id: PartyMode;
  title: string;
  subtitle: string;
  text: string;
  disabled: boolean;
  reason?: string;
  warning?: string;
}

const ONE_MASTER = 'Зараз один майстер у зміні — оберіть «По черзі» або інший час.';
const WHOLE_HALL = 'Займете обидва крісла, салон на цей час лише для вас.';

/** PARTY-005/006: parallel лише за двох барберів у зміні; на 2 кріслах — попередження. */
export function partyModeCards(input: {
  barbers: number;
  chairs?: number | undefined;
}): ModeCard[] {
  const blocked = input.barbers < 2;
  return [
    {
      id: 'sequential',
      title: 'По черзі',
      subtitle: 'Один барбер · 90 хв',
      text: 'Спочатку син, потім батько: друге крісло лишається для інших.',
      disabled: false,
    },
    {
      id: 'parallel',
      title: 'Одразу',
      subtitle: 'Два крісла · ~50 хв',
      text: 'Обидва стрижуться разом.',
      disabled: blocked,
      ...(blocked ? { reason: ONE_MASTER } : {}),
      ...(!blocked && input.chairs === 2 ? { warning: WHOLE_HALL } : {}),
    },
  ];
}

export interface PairCandidate {
  id: string;
  name: string;
  eligible: boolean;
  reason?: string;
}

const NO_MATRIX = 'Не виконує цю послугу — пара має нульовий перетин.';

/** Повний склад локації проти виконавців послуги (PARTY-004): перетин має бути. */
export function pairCandidates(roster: BarberDto[], performers: BarberDto[]): PairCandidate[] {
  const performing = new Set(performers.map((barber) => barber.id));
  return roster
    .filter((barber) => barber.id !== '')
    .map((barber) =>
      performing.has(barber.id)
        ? { id: barber.id, name: barber.name, eligible: true }
        : { id: barber.id, name: barber.name, eligible: false, reason: NO_MATRIX }
    );
}

export type PairProblem = 'choose-two' | 'same-barber' | 'not-in-matrix';

/** Рівно два різні барбери, обидва з матриці послуги. */
export function pairProblem(ids: string[], candidates: PairCandidate[]): PairProblem | null {
  if (ids.length !== 2) return 'choose-two';
  if (ids[0] === ids[1]) return 'same-barber';
  const eligible = new Set(candidates.filter((c) => c.eligible).map((c) => c.id));
  return ids.every((id) => eligible.has(id)) ? null : 'not-in-matrix';
}

/** PARTY-WEB-03: старти, де обидві ноги містяться; «будь-які два» — двоє вільних. */
export function partySlots(slots: AvailableSlotDto[], pair: string[]): AvailableSlotDto[] {
  return slots.filter((slot) =>
    pair.length === 2 ? pair.every((id) => slot.barbers.includes(id)) : slot.barbers.length >= 2
  );
}

/** Мультивибір двох: третій барбер витісняє найстаріший вибір, дублів не буває. */
export function togglePair(ids: string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((entry) => entry !== id);
  return [...ids, id].slice(-2);
}
