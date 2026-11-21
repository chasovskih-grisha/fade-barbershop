/* eslint-disable max-lines -- cohesive module (126 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4619a: утримання крісла під незаплачений депозит — вікно, оплата,
// скасування, sweeper, гонка «оплата після прострочення» і звільнення крісла.
import { DepositHoldError, isHoldExpired, type DepositHold } from '../domain/deposit-hold';
import {
  DepositHoldService,
  InMemoryDepositHoldRepository,
  type DepositHoldEvent,
} from './deposit-hold.service';

const T0 = new Date('2026-11-20T10:00:00.000Z');
const VISIT = {
  appointmentId: 'apt-1',
  barberId: 'barber-1',
  locationId: 'loc-1',
  startAt: new Date('2026-11-21T09:00:00.000Z'),
  endAt: new Date('2026-11-21T09:30:00.000Z'),
  depositAmount: 300,
};

function make() {
  const repository = new InMemoryDepositHoldRepository();
  const events: DepositHoldEvent[] = [];
  const service = new DepositHoldService(repository, (event) => {
    events.push(event);
  });
  return { repository, service, events };
}

describe('DepositHoldService (T-4619a)', () => {
  it('holds the chair for 15 minutes', async () => {
    const { service } = make();

    const hold = await service.open(VISIT, T0);

    expect(hold.status).toBe('active');
    expect(hold.expiresAt.toISOString()).toBe('2026-11-20T10:15:00.000Z');
    expect(hold.depositAmount).toBe(300);
  });

  it('does not hold a chair without a deposit (PAY-003)', async () => {
    const { service } = make();

    await expect(service.open({ ...VISIT, depositAmount: 0 }, T0)).rejects.toBeInstanceOf(
      DepositHoldError
    );
  });

  it('is idempotent for retries of the same visit', async () => {
    const { service } = make();

    const first = await service.open(VISIT, T0);
    const second = await service.open(VISIT, new Date(T0.getTime() + 60_000));

    expect(second.id).toBe(first.id);
    expect(second.expiresAt).toEqual(first.expiresAt);
  });

  it('captures the chair when the deposit arrives inside the window', async () => {
    const { service } = make();
    await service.open(VISIT, T0);

    const result = await service.capture('apt-1', new Date(T0.getTime() + 10 * 60_000));

    expect(result.outcome).toBe('captured');
    // Захоплене утримання не звільняє крісло — воно просто більше не активне.
    expect(await service.releasedAppointmentIds(new Date(T0.getTime() + 10 * 60_000))).toEqual(
      new Set()
    );
  });

  it('does not revive a terminal hold on a repeated open', async () => {
    const { service } = make();
    await service.open(VISIT, T0);
    await service.release('apt-1', T0);

    const reopened = await service.open(VISIT, new Date(T0.getTime() + 60_000));

    expect(reopened.status).toBe('cancelled');
    expect(await service.releasedAppointmentIds(T0)).toEqual(new Set(['apt-1']));
  });

  it('refuses a late capture and reports the hold as expired', async () => {
    const { service, events } = make();
    await service.open(VISIT, T0);
    const late = new Date(T0.getTime() + 16 * 60_000);

    expect((await service.capture('apt-1', late)).outcome).toBe('expired');
    expect(events.map((e) => e.type)).toEqual(['deposit_hold.expired']);
    expect((await service.capture('apt-1', late)).outcome).toBe('expired');
    expect(events).toHaveLength(1);
  });

  it('releases the chair when the visit is cancelled before payment', async () => {
    const { service } = make();
    await service.open(VISIT, T0);

    expect(await service.release('apt-1', T0)).toBe(true);
    expect(await service.release('apt-1', T0)).toBe(false);
    expect(await service.releasedAppointmentIds(T0)).toEqual(new Set(['apt-1']));
  });

  it('sweeps expired holds and frees their chairs exactly once', async () => {
    const { service, events } = make();
    await service.open(VISIT, T0);
    await service.open(
      {
        ...VISIT,
        appointmentId: 'apt-2',
        startAt: new Date('2026-11-21T11:00:00.000Z'),
        endAt: new Date('2026-11-21T11:30:00.000Z'),
      },
      T0
    );

    const at = new Date(T0.getTime() + 20 * 60_000);
    // Прострочені утримання звільняють крісло ще до проходу sweeper-а.
    expect(await service.releasedAppointmentIds(at)).toEqual(new Set(['apt-1', 'apt-2']));

    const swept = await service.sweep(at);

    expect(swept.map((h) => h.appointmentId).sort()).toEqual(['apt-1', 'apt-2']);
    expect(events).toHaveLength(2);
    expect(await service.sweep(at)).toEqual([]);
    expect(events).toHaveLength(2);
    expect(await service.releasedAppointmentIds(at)).toEqual(new Set(['apt-1', 'apt-2']));
  });

  it('keeps an unexpired hold blocking the chair', async () => {
    const { service } = make();
    await service.open(VISIT, T0);

    expect(await service.releasedAppointmentIds(new Date(T0.getTime() + 14 * 60_000))).toEqual(
      new Set()
    );
    expect(await service.releasedAppointmentIds(new Date(T0.getTime() + 16 * 60_000))).toEqual(
      new Set(['apt-1'])
    );
    expect(await service.sweep(new Date(T0.getTime() + 14 * 60_000))).toEqual([]);
  });

  it('treats a stale active row as expired even without the sweeper', () => {
    const stale = {
      id: 'h1',
      appointmentId: 'apt-1',
      barberId: 'barber-1',
      locationId: 'loc-1',
      startAt: VISIT.startAt,
      endAt: VISIT.endAt,
      expiresAt: T0,
      status: 'active',
      depositAmount: 300,
      createdAt: T0,
      updatedAt: T0,
    } satisfies DepositHold;

    expect(isHoldExpired(stale, new Date(T0.getTime() + 1))).toBe(true);
  });
});
