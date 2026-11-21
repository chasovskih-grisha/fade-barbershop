/* eslint-disable max-lines -- cohesive module (165 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-4560: обовʼязкова причина скасування, опційна причина
// no-show, статистика за розрізами, «excused» override і CSV-експорт.
import {
  MAX_CUSTOM_REASON_LENGTH,
  ReasonValidationError,
  parseCancellationReason,
  parseNoShowReason,
  toReasonedEventsCsv,
} from '../domain/cancellation-reasons';
import {
  InMemoryCancellationReasonRepository,
  NoShowManagementService,
} from './no-show-management.service';

const START = new Date('2026-11-20T13:00:00.000Z'); // пʼятниця, 13:00 UTC

function booking(overrides: { appointmentId?: string; barberId?: string; clientId?: string } = {}) {
  return {
    appointmentId: overrides.appointmentId ?? 'apt-1',
    clientId: overrides.clientId ?? 'client-1',
    barberId: overrides.barberId ?? 'barber-1',
    serviceId: 'svc-haircut',
    locationId: 'loc-1',
    channel: 'online_with_deposit' as const,
    start: START,
    cancelledBy: 'client' as const,
  };
}

function service() {
  const repository = new InMemoryCancellationReasonRepository();
  return { repository, service: new NoShowManagementService(repository) };
}

describe('cancellation and no-show reasons (T-4560)', () => {
  it('requires a known cancellation reason', () => {
    expect(parseCancellationReason({ reason: 'client_request' })).toEqual({
      reason: 'CLIENT_REQUEST',
    });
    expect(() => parseCancellationReason({ reason: '   ' })).toThrow(ReasonValidationError);
    expect(() => parseCancellationReason({})).toThrow('Cancellation reason is required');
    expect(() => parseCancellationReason({ reason: 'I_DONT_WANT' })).toThrow(
      'Unknown cancellation reason'
    );
  });

  it('requires custom text only for OTHER and caps its length', () => {
    expect(parseCancellationReason({ reason: 'OTHER', custom: '  зламався автомобіль  ' })).toEqual(
      {
        reason: 'OTHER',
        custom: 'зламався автомобіль',
      }
    );
    expect(() => parseCancellationReason({ reason: 'OTHER' })).toThrow(
      'Custom text is required for the OTHER reason'
    );
    expect(() =>
      parseCancellationReason({ reason: 'OTHER', custom: 'а'.repeat(MAX_CUSTOM_REASON_LENGTH + 1) })
    ).toThrow('Custom reason must be');
  });

  it('keeps the no-show reason optional', () => {
    expect(parseNoShowReason({})).toBeNull();
    expect(parseNoShowReason({ reason: 'client_late' })).toEqual({ reason: 'CLIENT_LATE' });
    expect(() => parseNoShowReason({ reason: 'UNKNOWN' })).toThrow('Unknown no-show reason');
  });
});

describe('NoShowManagementService (T-4560)', () => {
  it('records a cancellation with its reason and actor', async () => {
    const { service: management, repository } = service();

    const event = await management.cancel({ ...booking(), reason: 'CLIENT_SICK' });

    expect(event.kind).toBe('cancellation');
    expect(event.reason).toBe('CLIENT_SICK');
    expect(event.cancelledBy).toBe('client');
    await expect(repository.list()).resolves.toHaveLength(1);
  });

  it('refuses a cancellation without a reason', async () => {
    const { service: management, repository } = service();

    await expect(management.cancel(booking())).rejects.toThrow('Cancellation reason is required');
    await expect(repository.list()).resolves.toHaveLength(0);
  });

  it('records a no-show with an optional reason', async () => {
    const { service: management } = service();

    const plain = await management.markNoShow({ ...booking({ appointmentId: 'apt-a' }) });
    const explained = await management.markNoShow({
      ...booking({ appointmentId: 'apt-b' }),
      reason: 'CLIENT_NO_SHOW',
      cancelledBy: 'barber',
    });

    expect(plain.noShowReason).toBeUndefined();
    expect(explained.noShowReason).toBe('CLIENT_NO_SHOW');
    expect(explained.cancelledBy).toBe('barber');
  });

  it('excludes an excused no-show from the statistics (manual override)', async () => {
    const { service: management } = service();
    await management.markNoShow({ ...booking({ appointmentId: 'apt-1' }) });
    await management.markNoShow({ ...booking({ appointmentId: 'apt-2' }) });

    let stats = await management.stats();
    expect(stats.noShows).toBe(2);
    expect(stats.excusedNoShows).toBe(0);
    expect(stats.byBarber['barber-1']).toEqual({ total: 2, count: 2, rate: 1 });

    const excused = await management.excuse('apt-2');

    stats = await management.stats();
    expect(excused.excused).toBe(true);
    expect(stats.noShows).toBe(1);
    expect(stats.excusedNoShows).toBe(1);
    expect(stats.byBarber['barber-1']).toEqual({ total: 2, count: 1, rate: 0.5 });
  });

  it('reports a missing no-show when excusing', async () => {
    const { service: management } = service();

    await expect(management.excuse('missing')).rejects.toThrow('No-show missing not found');
  });

  it('breaks the no-show rate down by barber, service, location, channel, weekday and hour', async () => {
    const { service: management } = service();
    await management.markNoShow({ ...booking({ appointmentId: 'a1', barberId: 'barber-1' }) });
    await management.markNoShow({ ...booking({ appointmentId: 'a2', barberId: 'barber-2' }) });
    await management.cancel({
      ...booking({ appointmentId: 'a3', barberId: 'barber-1' }),
      reason: 'CLIENT_REQUEST',
    });

    const stats = await management.stats();

    expect(stats.total).toBe(3);
    expect(stats.cancellations).toBe(1);
    expect(stats.noShows).toBe(2);
    expect(stats.cancellationRate).toBe(0.3333);
    expect(stats.byBarber['barber-1']).toEqual({ total: 2, count: 1, rate: 0.5 });
    expect(stats.byBarber['barber-2']).toEqual({ total: 1, count: 1, rate: 1 });
    expect(stats.byService['svc-haircut']).toEqual({ total: 3, count: 2, rate: 0.6667 });
    expect(stats.byLocation['loc-1']?.total).toBe(3);
    expect(stats.byChannel['online_with_deposit']?.count).toBe(2);
    expect(stats.byWeekday['friday']?.total).toBe(3);
    expect(stats.byHour['13:00']?.total).toBe(3);
    expect(stats.topCancellationReasons).toEqual([{ reason: 'CLIENT_REQUEST', count: 1 }]);
  });

  it('counts the top no-show reasons, ignoring excused cases', async () => {
    const { service: management } = service();
    await management.markNoShow({
      ...booking({ appointmentId: 'a1' }),
      reason: 'CLIENT_NO_SHOW',
    });
    await management.markNoShow({
      ...booking({ appointmentId: 'a2' }),
      reason: 'CLIENT_NO_SHOW',
    });
    await management.markNoShow({ ...booking({ appointmentId: 'a3' }), reason: 'CLIENT_LATE' });
    await management.excuse('a3');

    expect((await management.stats()).topNoShowReasons).toEqual([
      { reason: 'CLIENT_NO_SHOW', count: 2 },
    ]);
  });

  it('does not double count a case after the override is recorded', async () => {
    const { service: management } = service();
    await management.markNoShow({ ...booking() });
    await management.excuse('apt-1');

    expect((await management.stats()).total).toBe(1);
    expect(await management.events()).toHaveLength(2);
  });

  it('exports the journal as CSV with escaped custom text', async () => {
    const { service: management } = service();
    await management.cancel({
      ...booking(),
      reason: 'OTHER',
      custom: 'клієнт, "терміново"',
    });

    const csv = await management.csv();
    const [header, row] = csv.split('\n');

    expect(header).toContain('appointmentId');
    expect(header).toContain('customReason');
    expect(row).toContain('"клієнт, ""терміново"""');
    expect(row).toContain('cancellation');
    expect(toReasonedEventsCsv([])).toBe(header);
  });
});
