// T-4802: резервація слота — TTL, ретраї з backoff, аудит і головна вимога:
// 50 одночасних запитів на той самий слот дають рівно одного переможця.
import { SlotReservations } from './slot-reservations.service';
import type { SlotLockAudit, SlotLockAuditEvent } from './slot-lock.ports';
import { InMemorySlotLock } from '../infrastructure/in-memory-slot-lock';
import { SLOT_RESERVATION_TTL_MS, SlotLockedError } from '../domain/slot-reservation';

const NOW = new Date('2026-11-20T10:00:00.000Z');
const TARGET = { locationId: 'loc-1', barberId: 'barber-1', start: new Date('2026-11-20T12:00:00Z') };

class RecordingAudit implements SlotLockAudit {
  readonly events: SlotLockAuditEvent[] = [];
  record(event: SlotLockAuditEvent): void {
    this.events.push(event);
  }
}

const noSleep = async (): Promise<void> => undefined;

describe('SlotReservations (T-4802)', () => {
  it('видає токен із 60-секундним TTL і тримає його до звільнення', async () => {
    const store = new InMemorySlotLock();
    const service = new SlotReservations(store, new RecordingAudit(), { sleep: noSleep });

    const reservation = await service.reserve(TARGET, NOW);

    expect(reservation.token).toBeTruthy();
    expect(reservation.expiresAt.getTime()).toBe(NOW.getTime() + SLOT_RESERVATION_TTL_MS);
    await expect(service.assertHeldBy(reservation.key, reservation.token)).resolves.toBeUndefined();
    expect(await store.find(reservation.key)).toBe(reservation.token);
  });

  it('після звільнення слот вільний для наступного клієнта', async () => {
    const service = new SlotReservations(new InMemorySlotLock(), new RecordingAudit(), { sleep: noSleep });
    const first = await service.reserve(TARGET, NOW);

    expect(await service.release(first)).toBe(true);
    const second = await service.reserve(TARGET, NOW);
    expect(second.token).not.toBe(first.token);
  });

  it('чужий або застарілий токен не проходить перевірку', async () => {
    const service = new SlotReservations(new InMemorySlotLock(), new RecordingAudit(), { sleep: noSleep });
    const reservation = await service.reserve(TARGET, NOW);

    await expect(service.assertHeldBy(reservation.key, 'someone-else')).rejects.toThrow(
      'no longer held'
    );
    await service.release(reservation);
    await expect(service.assertHeldBy(reservation.key, reservation.token)).rejects.toThrow(
      'no longer held'
    );
  });

  it('після простроченого TTL слот займає новий клієнт', async () => {
    let clock = NOW.getTime();
    const store = new InMemorySlotLock(() => clock);
    const service = new SlotReservations(store, new RecordingAudit(), { sleep: noSleep });
    await service.reserve(TARGET, NOW);
    const later = new Date(NOW.getTime() + SLOT_RESERVATION_TTL_MS + 1);
    clock = later.getTime();

    const next = await service.reserve(TARGET, later);
    expect(next.token).toBeTruthy();
    expect(await store.find(next.key)).toBe(next.token);
  });

  it('після вичерпаних ретраїв кидає SlotLockedError і пише аудит таймауту', async () => {
    const audit = new RecordingAudit();
    const store = new InMemorySlotLock();
    await store.acquire('lock:slot:loc-1:barber-1:2026-11-20T12:00:00.000Z', 'other', 60_000);
    const service = new SlotReservations(store, audit, { sleep: noSleep });

    await expect(service.reserve(TARGET, NOW)).rejects.toBeInstanceOf(SlotLockedError);
    expect(audit.events).toEqual([
      expect.objectContaining({ type: 'timeout', attempts: 3 }),
    ]);
  });

  it('збій звільнення не кидає помилку, але лишає аудит', async () => {
    const audit = new RecordingAudit();
    const service = new SlotReservations(new InMemorySlotLock(), audit, { sleep: noSleep });
    const reservation = await service.reserve(TARGET, NOW);

    const released = await service.release({ ...reservation, token: 'stale-token' });
    expect(released).toBe(false);
    expect(audit.events.some((event) => event.type === 'release_failed')).toBe(true);
  });

  it('50 одночасних резервацій одного слота: 1 переможець, 49 чистих відмов', async () => {
    const store = new InMemorySlotLock();
    const service = new SlotReservations(store, new RecordingAudit(), { sleep: noSleep });

    const attempts = await Promise.allSettled(
      Array.from({ length: 50 }, () => service.reserve(TARGET, NOW))
    );
    const winners = attempts.filter((result) => result.status === 'fulfilled');
    const losers = attempts.filter((result) => result.status === 'rejected');

    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(49);
    expect(
      losers.every(
        (result) => result.status === 'rejected' && result.reason instanceof SlotLockedError
      )
    ).toBe(true);
  });
});
