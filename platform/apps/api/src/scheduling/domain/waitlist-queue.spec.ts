// Специфікація черги листа очікування (T-170a): FIFO-конфігурація, soft-hold
// 15 хв, прострочення і анти-спам. Чистий домен, без БД.

import {
  MAX_CONSECUTIVE_MISSES,
  OFFER_WINDOW_MINUTES,
  expireOffers,
  matchesConfiguration,
  offerSlot,
  registerMiss,
  selectNextEntry,
  type FreedSlot,
  type WaitlistEntryData,
} from './waitlist-queue';

const slot: FreedSlot = {
  locationId: 'loc-1',
  serviceId: 'svc-1',
  barberId: 'bar-1',
  date: '2026-11-20',
  start: '14:00',
};

const entry = (over: Partial<WaitlistEntryData> = {}): WaitlistEntryData => ({
  id: 'w-1',
  clientId: 'c-1',
  configuration: {
    locationId: 'loc-1',
    serviceId: 'svc-1',
    barberId: 'bar-1',
    windowFrom: '2026-11-15',
    windowTo: '2026-11-29',
    precision: 'exact',
  },
  status: 'waiting',
  waitingSince: new Date('2026-11-15T10:00:00Z'),
  consecutiveMisses: 0,
  ...over,
});

describe('waitlist queue (T-170a)', () => {
  it('обирає найстарішу заявку цієї конфігурації, а не VIP (FIFO, WTL-002)', () => {
    const older = entry({ id: 'w-old', waitingSince: new Date('2026-11-15T08:00:00Z') });
    const newer = entry({ id: 'w-new', waitingSince: new Date('2026-11-15T11:00:00Z') });

    const next = selectNextEntry([newer, older], slot);

    expect(next?.id).toBe('w-old');
  });

  it('«Будь-який барбер» матчиться, а конкретний чужий — ні (WTL-001)', () => {
    const any = entry({
      id: 'w-any',
      configuration: { ...entry().configuration, barberId: null },
    });
    const otherBarber = entry({
      id: 'w-other',
      configuration: { ...entry().configuration, barberId: 'bar-2' },
    });

    expect(matchesConfiguration(any.configuration, slot)).toBe(true);
    expect(matchesConfiguration(otherBarber.configuration, slot)).toBe(false);
  });

  it('не бере заявку поза вікном дат, іншої локації чи послуги (WTL-002)', () => {
    const outsideWindow = entry({
      configuration: { ...entry().configuration, windowFrom: '2026-12-01', windowTo: '2026-12-10' },
    });
    const otherLocation = entry({
      configuration: { ...entry().configuration, locationId: 'loc-2' },
    });

    expect(selectNextEntry([outsideWindow, otherLocation], slot)).toBeNull();
  });

  it('пропозиція ставить soft-hold на 15 хвилин (WTL-003/005)', () => {
    const now = new Date('2026-11-15T12:00:00Z');

    const offered = offerSlot(entry(), now);

    expect(offered.status).toBe('offered');
    expect(offered.holdExpiresAt).toEqual(new Date(now.getTime() + OFFER_WINDOW_MINUTES * 60_000));
  });

  it('прострочена пропозиція закривається, активна лишається (WTL-004)', () => {
    const now = new Date('2026-11-15T12:00:00Z');
    const expired = entry({
      id: 'w-exp',
      status: 'offered',
      holdExpiresAt: new Date('2026-11-15T11:59:00Z'),
    });
    const active = entry({
      id: 'w-act',
      status: 'offered',
      holdExpiresAt: new Date('2026-11-15T12:10:00Z'),
    });

    const result = expireOffers([expired, active], now);

    expect(result[0]?.status).toBe('expired');
    expect(result[1]?.status).toBe('offered');
  });

  it('третє неспрацювання поспіль ставить чергу на паузу (WTL-005)', () => {
    let state = entry({ consecutiveMisses: MAX_CONSECUTIVE_MISSES - 1 });

    state = registerMiss(state);

    expect(state.status).toBe('paused');
    expect(state.consecutiveMisses).toBe(MAX_CONSECUTIVE_MISSES);
  });
});
