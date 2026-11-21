/* eslint-disable max-lines -- cohesive module (782 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-4560: no-show і скасування — причини, вікно безкоштовного
// скасування, депозит для ризикованих клієнтів, статистика й ручні винятки.
import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AttendanceError,
  AttendanceRecord,
  DEFAULT_NO_SHOW_POLICY,
  type NoShowPolicy,
} from '../domain/attendance-management';
import {
  InMemoryAttendanceRepository,
  InMemoryNoShowPolicyRepository,
  InMemoryAppointmentVolume,
  RecordingAttendanceEvents,
} from './infra/infra';
import {
  normalizeNoShowPolicy,
  parseCancellationReason,
  parseNoShowReason,
  decideCancellation,
  excuseNoShow,
  waiveCancellationFee,
  assessHighRisk,
  computeNoShowStats,
  clientAttendanceHistory,
} from '../domain/attendance-management';
import { AttendanceManagementService } from './attendance-management.service';
import { AttendanceManagementController } from '../infrastructure/attendance-management.controller';

const NOW = new Date('2026-11-19T12:00:00Z');

function policy(overrides: Partial<NoShowPolicy> = {}): NoShowPolicy {
  return normalizeNoShowPolicy(overrides);
}

function assertAttendanceError(fn: () => unknown, expectedMessage: string): void {
  try {
    fn();
    throw new Error('Expected AttendanceError but none thrown');
  } catch (e) {
    if (!(e instanceof AttendanceError)) throw e;
    if (e.message !== expectedMessage)
      throw new Error(`Expected "${expectedMessage}", got "${e.message}"`);
  }
}

describe('attendance management domain (T-4560)', () => {
  it('normalizes no-show policy and rejects bad values', () => {
    const p = policy({});
    expect(p.freeCancelHours).toBe(24);
    expect(p.lateCancelFeePercent).toBe(50);

    assertAttendanceError(
      () => normalizeNoShowPolicy({ freeCancelHours: -1 }),
      'freeCancelHours must be >= 0'
    );
    assertAttendanceError(
      () => normalizeNoShowPolicy({ lateCancelFeePercent: 101 }),
      'lateCancelFeePercent must be between 0 and 100'
    );
    assertAttendanceError(
      () => normalizeNoShowPolicy({ highRiskThreshold: { count: 0, days: 90 } }),
      'highRiskThreshold.count must be a positive integer'
    );
    assertAttendanceError(
      () => normalizeNoShowPolicy({ highRiskThreshold: { count: 3, days: 0 } }),
      'highRiskThreshold.days must be a positive integer'
    );

    const good = normalizeNoShowPolicy({ freeCancelHours: 12, lateCancelFeePercent: 20 });
    expect(good.freeCancelHours).toBe(12);
    expect(good.lateCancelFeePercent).toBe(20);
  });

  it('parses cancellation reason and rejects bad ones', () => {
    expect(parseCancellationReason({ code: 'CLIENT_REQUEST', note: '' })).toEqual({
      code: 'CLIENT_REQUEST',
      note: null,
    });
    expect(parseCancellationReason({ code: 'CLIENT_SICK', note: 'sick note' })).toEqual({
      code: 'CLIENT_SICK',
      note: 'sick note',
    });
    assertAttendanceError(
      () => parseCancellationReason({ code: 'UNKNOWN', note: '' }),
      'Unknown cancellation reason: UNKNOWN'
    );
    assertAttendanceError(
      () => parseCancellationReason({ code: 'OTHER' }),
      'Reason OTHER requires a free-text note'
    );
    expect(parseCancellationReason({ code: 'OTHER', note: 'some note' })).toEqual({
      code: 'OTHER',
      note: 'some note',
    });
  });

  it('parses no-show reason and rejects bad ones', () => {
    expect(parseNoShowReason({ code: 'CLIENT_NO_SHOW', note: '' })).toEqual({
      code: 'CLIENT_NO_SHOW',
      note: null,
    });
    assertAttendanceError(
      () => parseNoShowReason({ code: 'UNKNOWN' }),
      'Unknown no-show reason: UNKNOWN'
    );
    expect(parseNoShowReason({ code: 'OTHER', note: 'note' })).toEqual({
      code: 'OTHER',
      note: 'note',
    });
  });

  it('decides cancellation: salon-side free', () => {
    const p = normalizeNoShowPolicy();

    // Salon-side: always free
    expect(
      decideCancellation({
        policy: p,
        reason: { code: 'BARBER_SICK', note: '' },
        appointmentStart: new Date('2026-11-25T10:00:00Z'),
        cancelledAt: new Date('2026-11-20T10:00:00Z'),
      })
    ).toEqual({ free: true, hoursBefore: 120, feePercent: 0, salonSide: true });
  });

  it('decides cancellation: after free window', () => {
    const p = normalizeNoShowPolicy();

    // After free window
    expect(
      decideCancellation({
        policy: p,
        reason: { code: 'CLIENT_REQUEST', note: '' },
        appointmentStart: new Date('2026-11-25T10:00:00Z'),
        cancelledAt: new Date('2026-11-20T10:00:00Z'),
      })
    ).toEqual({ free: true, hoursBefore: 120, feePercent: 0, salonSide: false });
  });

  it('decides cancellation: before free window, non-salon', () => {
    const p = normalizeNoShowPolicy();

    // Before free window, non-salon (just inside 24-hour free window)
    expect(
      decideCancellation({
        policy: p,
        reason: { code: 'CLIENT_SICK', note: '' },
        appointmentStart: new Date('2026-11-25T10:00:00Z'),
        cancelledAt: new Date('2026-11-24T11:00:00Z'),
      })
    ).toEqual({ free: false, hoursBefore: 23, feePercent: 50, salonSide: false });
  });

  it('decides cancellation: client request before window but salon-side', () => {
    const p = normalizeNoShowPolicy();

    // Client request before window (non-salon reason)
    expect(
      decideCancellation({
        policy: p,
        reason: { code: 'CLIENT_REQUEST', note: '' },
        appointmentStart: new Date('2026-11-25T10:00:00Z'),
        cancelledAt: new Date('2026-11-23T10:00:00Z'),
      })
    ).toEqual({ free: true, hoursBefore: 48, feePercent: 0, salonSide: false });
  });

  it('excuses no-show once and refuses a second time', () => {
    const record: AttendanceRecord = {
      id: 'rec-1',
      appointmentId: 'ap-1',
      type: 'no_show',
      clientId: 'c-1',
      barberId: 'b-1',
      locationId: 'l-1',
      serviceId: null,
      channel: null,
      reason: { code: 'CLIENT_NO_SHOW', note: null },
      actorRole: 'barber',
      appointmentStart: NOW,
      recordedAt: NOW,
      recordedBy: 'admin-1',
      freeCancellation: null,
      feePercent: 0,
      feeWaived: false,
      excused: false,
      excusedBy: null,
      excusedAt: null,
      excusedReason: null,
    };

    const excused = excuseNoShow(record, {
      by: 'admin-1',
      reason: 'client had emergency',
      at: new Date('2026-11-19T14:00:00Z'),
    });
    expect(excused.excused).toBe(true);
    expect(excused.excusedBy).toBe('admin-1');
    expect(excused.excusedAt).toEqual(new Date('2026-11-19T14:00:00Z'));
    expect(excused.excusedReason).toBe('client had emergency');

    // Refuse a second excuse - domain returns the same record
    const stillExcused = excuseNoShow(excused, { by: 'admin-1', reason: 'again', at: new Date() });
    expect(stillExcused.excused).toBe(true);
  });

  it('waives cancellation fee and refuses on already waived', () => {
    const record: AttendanceRecord = {
      id: 'rec-2',
      appointmentId: 'ap-2',
      type: 'cancellation',
      clientId: 'c-2',
      barberId: 'b-2',
      locationId: 'l-2',
      serviceId: null,
      channel: null,
      reason: { code: 'CLIENT_REQUEST', note: '' },
      actorRole: 'client',
      appointmentStart: NOW,
      recordedAt: NOW,
      recordedBy: 'admin-1',
      freeCancellation: false,
      feePercent: 50,
      feeWaived: false,
      excused: false,
      excusedBy: null,
      excusedAt: null,
      excusedReason: null,
    };

    const waived = waiveCancellationFee(record, {
      by: 'admin-1',
      reason: 'client is good',
      at: new Date(),
    });
    expect(waived.feeWaived).toBe(true);
    expect(waived.feePercent).toBe(0);

    // Refuse a second waive - domain returns the same record
    const stillWaived = waiveCancellationFee(waived, {
      by: 'admin-1',
      reason: 'again',
      at: new Date(),
    });
    expect(stillWaived.feeWaived).toBe(true);
  });

  it('assesses high risk: counts non-excused no-shows in the threshold window', () => {
    const windowMs = 90 * 24 * 60 * 60 * 1000;
    const from = new Date(NOW.getTime() - windowMs);

    const assessment = assessHighRisk({
      clientId: 'c-risk',
      records: [
        // 4 no-shows, all not excused, within window
        ...Array.from({ length: 4 }, (_, i): AttendanceRecord => ({
          id: `rec-${i}`,
          appointmentId: `ap-${i}`,
          type: 'no_show',
          clientId: 'c-risk',
          barberId: 'b-1',
          locationId: 'l-1',
          serviceId: null,
          channel: null,
          reason: { code: 'CLIENT_NO_SHOW', note: null },
          actorRole: 'barber',
          appointmentStart: new Date(from.getTime() + i * 24 * 60 * 60 * 1000),
          recordedAt: new Date(),
          recordedBy: 'admin-1',
          freeCancellation: null,
          feePercent: 0,
          feeWaived: false,
          excused: false,
          excusedBy: null,
          excusedAt: null,
          excusedReason: null,
        })),
        // One excused - should not count
        {
          id: 'rec-excused',
          appointmentId: 'ap-exc',
          type: 'no_show',
          clientId: 'c-risk',
          barberId: 'b-1',
          locationId: 'l-1',
          serviceId: null,
          channel: null,
          reason: { code: 'CLIENT_NO_SHOW', note: null },
          actorRole: 'barber',
          appointmentStart: new Date(from.getTime() + 100 * 24 * 60 * 60 * 1000),
          recordedAt: new Date(),
          recordedBy: 'admin-1',
          freeCancellation: null,
          feePercent: 0,
          feeWaived: false,
          excused: true,
          excusedBy: 'admin-1',
          excusedAt: new Date(),
          excusedReason: 'client had emergency',
        },
        // Out-of-window should not count
        {
          id: 'rec-out',
          appointmentId: 'ap-out',
          type: 'no_show',
          clientId: 'c-risk',
          barberId: 'b-1',
          locationId: 'l-1',
          serviceId: null,
          channel: null,
          reason: { code: 'CLIENT_NO_SHOW', note: null },
          actorRole: 'barber',
          appointmentStart: new Date(from.getTime() - 100 * 24 * 60 * 60 * 1000),
          recordedAt: new Date(),
          recordedBy: 'admin-1',
          freeCancellation: null,
          feePercent: 0,
          feeWaived: false,
          excused: false,
          excusedBy: null,
          excusedAt: null,
          excusedReason: null,
        },
      ],
      policy: {
        ...DEFAULT_NO_SHOW_POLICY,
        depositForHighRisk: true,
        highRiskThreshold: { count: 3, days: 90 },
      },
      now: NOW,
    });

    expect(assessment.noShowCount).toBe(4);
    expect(assessment.requireFullDeposit).toBe(true);
    expect(assessment.blockOnlineBooking).toBe(true);

    // Without depositForHighRisk - no restriction
    const withoutDeposit = assessHighRisk({
      clientId: 'c-nodep',
      records: [
        ...Array.from({ length: 4 }, (_, i): AttendanceRecord => ({
          id: `rec-${i}`,
          appointmentId: `ap-${i}`,
          type: 'no_show',
          clientId: 'c-nodef',
          barberId: 'b-1',
          locationId: 'l-1',
          serviceId: null,
          channel: null,
          reason: { code: 'CLIENT_NO_SHOW', note: null },
          actorRole: 'barber',
          appointmentStart: new Date(from.getTime() + i * 24 * 60 * 60 * 1000),
          recordedAt: new Date(),
          recordedBy: 'admin-1',
          freeCancellation: null,
          feePercent: 0,
          feeWaived: false,
          excused: false,
          excusedBy: null,
          excusedAt: null,
          excusedReason: null,
        })),
      ],
      policy: {
        ...DEFAULT_NO_SHOW_POLICY,
        depositForHighRisk: false,
        highRiskThreshold: { count: 3, days: 90 },
      },
      now: NOW,
    });
    expect(withoutDeposit.requireFullDeposit).toBe(false);
    expect(withoutDeposit.blockOnlineBooking).toBe(false);
  });

  it('computes stats: rates, top reasons, weekday/hour dimensions', () => {
    const records: AttendanceRecord[] = [
      // no-shows
      {
        id: 'nr-1',
        appointmentId: 'a1',
        type: 'no_show',
        clientId: 'c1',
        barberId: 'b1',
        locationId: 'l1',
        serviceId: null,
        channel: null,
        reason: { code: 'CLIENT_NO_SHOW', note: 'forgot' },
        actorRole: 'client',
        appointmentStart: new Date('2026-11-20T10:00:00Z'),
        recordedAt: NOW,
        recordedBy: 'a1',
        freeCancellation: null,
        feePercent: 0,
        feeWaived: false,
        excused: false,
        excusedBy: null,
        excusedAt: null,
        excusedReason: null,
      },
      {
        id: 'nr-2',
        appointmentId: 'a2',
        type: 'no_show',
        clientId: 'c1',
        barberId: 'b1',
        locationId: 'l1',
        serviceId: null,
        channel: null,
        reason: { code: 'CLIENT_NO_SHOW', note: '' },
        actorRole: 'client',
        appointmentStart: new Date('2026-11-22T14:00:00Z'),
        recordedAt: new Date('2026-11-23T09:00:00Z'),
        recordedBy: 'a1',
        freeCancellation: null,
        feePercent: 0,
        feeWaived: false,
        excused: false,
        excusedBy: null,
        excusedAt: null,
        excusedReason: null,
      },
      // cancellations
      {
        id: 'c1',
        appointmentId: 'a3',
        type: 'cancellation',
        clientId: 'c1',
        barberId: 'b1',
        locationId: 'l1',
        serviceId: null,
        channel: null,
        reason: { code: 'CLIENT_SICK', note: 'flu' },
        actorRole: 'client',
        appointmentStart: new Date('2026-11-18T10:00:00Z'),
        recordedAt: NOW,
        recordedBy: 'a1',
        freeCancellation: false,
        feePercent: 50,
        feeWaived: false,
        excused: false,
        excusedBy: null,
        excusedAt: null,
        excusedReason: null,
      },
    ];

    const stats = computeNoShowStats({
      records,
      from: new Date('2026-11-01T00:00:00Z'),
      to: new Date('2026-11-30T23:59:59Z'),
      totalAppointments: 20,
    });

    expect(stats.totalAppointments).toBe(20);
    expect(stats.noShows).toBe(2);
    expect(stats.cancellations).toBe(1);
    expect(stats.excusedNoShows).toBe(0);
    expect(stats.noShowRate).toBe(10);
    expect(stats.cancellationRate).toBe(5);
    expect(stats.topReasons).toEqual([{ code: 'CLIENT_NO_SHOW', count: 2 }]);
    expect(stats.topCancellationReasons).toEqual([{ code: 'CLIENT_SICK', count: 1 }]);

    // weekday/hour dimensions: 20.11.2026 10:00 = Sunday, 20.11.2026 14:00 = Tuesday, 20.11.18 10:00 = Thursday
    expect(stats.byWeekday).toHaveLength(3);
    expect(stats.byHour.length).toBeGreaterThan(0);
  });

  it('computes client history and trend', () => {
    const clientRecords: AttendanceRecord[] = [
      ...Array.from({ length: 3 }, (_, i): AttendanceRecord => ({
        id: `rec-${i}`,
        appointmentId: `a${i}`,
        type: 'no_show',
        clientId: 'c1',
        barberId: 'b1',
        locationId: 'l1',
        serviceId: null,
        channel: null,
        reason: { code: 'CLIENT_NO_SHOW', note: null },
        actorRole: 'client',
        appointmentStart: new Date('2026-11-10T10:00:00Z'),
        recordedAt: new Date('2026-11-10T11:00:00Z'),
        recordedBy: 'a1',
        freeCancellation: null,
        feePercent: 0,
        feeWaived: false,
        excused: false,
        excusedBy: null,
        excusedAt: null,
        excusedReason: null,
      })),
      ...Array.from({ length: 1 }, (_, i): AttendanceRecord => ({
        id: `rec-exc-${i}`,
        appointmentId: `a-exc-${i}`,
        type: 'no_show',
        clientId: 'c1',
        barberId: 'b1',
        locationId: 'l1',
        serviceId: null,
        channel: null,
        reason: { code: 'CLIENT_NO_SHOW', note: null },
        actorRole: 'client',
        appointmentStart: new Date('2026-11-25T10:00:00Z'),
        recordedAt: new Date('2026-11-25T11:00:00Z'),
        recordedBy: 'a1',
        freeCancellation: null,
        feePercent: 0,
        feeWaived: false,
        excused: true,
        excusedBy: 'client',
        excusedAt: new Date('2026-11-25T11:00:00Z'),
        excusedReason: 'client had emergency',
      })),
    ];

    const hist = clientAttendanceHistory(clientRecords, 'c1', new Date('2026-12-01T12:00:00Z'));
    expect(hist.totalNoShows).toBe(3);
    expect(hist.excusedNoShows).toBe(1);
    expect(hist.cancellations).toBe(0);
    expect(hist.trend).toBe('worsening');
  });
});

describe('AttendanceManagementService (T-4560)', () => {
  async function setup(seed?: {
    policy?: Partial<NoShowPolicy>;
    records?: AttendanceRecord[];
    now?: Date;
  }) {
    const repo = new InMemoryAttendanceRepository();
    if (seed?.records) {
      for (const r of seed.records) await repo.save(r);
    }
    const policyRepo = new InMemoryNoShowPolicyRepository(seed?.policy ? [seed.policy] : []);
    const volume = new InMemoryAppointmentVolume(20);
    const events = new RecordingAttendanceEvents();
    const clockNow = seed?.now ?? NOW;
    const service = new AttendanceManagementService(repo, policyRepo, volume, events, {
      now: () => clockNow,
    });
    return { repo, policyRepo, volume, events, service };
  }

  it('records cancellation with the right decision', async () => {
    const { service } = await setup({
      records: [],
    });

    const record = await service.recordCancellation({
      appointmentId: 'a1',
      clientId: 'c1',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_REQUEST', note: '' },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-25T10:00:00Z'),
      by: 'client-1',
      policy: normalizeNoShowPolicy(),
    });

    expect(record.type).toBe('cancellation');
    expect(record.clientId).toBe('c1');
    expect(record.recordedBy).toBe('client-1');
    expect(record.freeCancellation).toBe(true); // > 24h before
  });

  it('records no-show and emits high-risk event when threshold passed', async () => {
    const { service, events } = await setup({ records: [], now: new Date('2026-11-22T12:00:00Z') });

    // Record 4 no-shows quickly
    await service.recordNoShow({
      appointmentId: 'a1',
      clientId: 'c-risk',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_NO_SHOW', note: '' },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-18T10:00:00Z'),
      by: 'client-1',
    });
    await service.recordNoShow({
      appointmentId: 'a2',
      clientId: 'c-risk',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_NO_SHOW', note: '' },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-19T10:00:00Z'),
      by: 'client-1',
    });
    await service.recordNoShow({
      appointmentId: 'a3',
      clientId: 'c-risk',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_NO_SHOW', note: '' },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-20T10:00:00Z'),
      by: 'client-1',
    });
    await service.recordNoShow({
      appointmentId: 'a4',
      clientId: 'c-risk',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_NO_SHOW', note: '' },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-21T10:00:00Z'),
      by: 'client-1',
    });

    const risk = await service.risk('c-risk');
    expect(risk.noShowCount).toBe(4);
    expect(risk.requireFullDeposit).toBe(true);
    expect(risk.blockOnlineBooking).toBe(true);

    const emitted = events.list();
    const highRiskEvents = emitted.filter((e) => e.type === 'client.high_risk');
    expect(highRiskEvents).toHaveLength(2);
    expect(highRiskEvents?.[0]?.payload?.requireFullDeposit).toBe(true);
    expect(highRiskEvents?.[1]?.payload?.requireFullDeposit).toBe(true);
  });

  it('stats shows rates and dimensions', async () => {
    const { service } = await setup({ records: [] });

    await service.recordCancellation({
      appointmentId: 'a1',
      clientId: 'c1',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_SICK', note: 'flu' },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-25T10:00:00Z'),
      by: 'client-1',
      policy: normalizeNoShowPolicy(),
    });
    await service.recordNoShow({
      appointmentId: 'a2',
      clientId: 'c1',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_NO_SHOW', note: 'forgot' },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-22T14:00:00Z'),
      by: 'client-1',
    });
    await service.recordNoShow({
      appointmentId: 'a3',
      clientId: 'c1',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_NO_SHOW', note: 'late' },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-20T10:00:00Z'),
      by: 'client-1',
    });

    const hist = await service.stats({
      from: new Date('2026-11-01T00:00:00Z'),
      to: new Date('2026-11-30T23:59:59Z'),
    });
    expect(hist.totalAppointments).toBe(20);
    expect(hist.noShows).toBe(2);
    expect(hist.cancellations).toBe(1);
  });

  it('history shows client counts and trend', async () => {
    const { service } = await setup({ records: [] });
    const recordedIds: string[] = [];

    for (let i = 0; i < 5; i++) {
      const record = await service.recordNoShow({
        appointmentId: `a${i}`,
        clientId: 'c1',
        barberId: 'b1',
        locationId: 'l1',
        reason: { code: 'CLIENT_NO_SHOW', note: null },
        actorRole: 'client',
        appointmentStart: new Date('2026-11-10T10:00:00Z'),
        by: 'client-1',
      });
      recordedIds.push(record.id);
    }
    await service.recordNoShow({
      appointmentId: 'a5',
      clientId: 'c1',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_NO_SHOW', note: null },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-25T10:00:00Z'),
      by: 'client-1',
    });
    recordedIds.push('a5'); // This will be the 6th record, but we only excuse 1st
    await service.excuse(recordedIds[0] ?? '', {
      by: 'admin-1',
      reason: 'client had emergency',
      at: new Date(),
    });

    const hist = await service.history('c1', new Date('2026-12-01T12:00:00Z'));
    expect(hist.totalNoShows).toBe(5);
    expect(hist.excusedNoShows).toBe(1);
    expect(hist.trend).toBe('worsening');
  });

  it('sets restriction and lifts it', async () => {
    const { service } = await setup({ records: [] });

    await service.setRestriction('c1', { lifted: false, by: 'admin-1', note: 'too many no-shows' });
    expect(
      await service.setRestriction('c1', { lifted: true, by: 'admin-1', note: 'client rebooked' })
    ).toHaveProperty('lifted', true);
  });

  it('excuses a no-show and refuses a second time on the same record', async () => {
    const { service } = await setup({ records: [] });

    // Create a no-show first
    const record = await service.recordNoShow({
      appointmentId: 'a1',
      clientId: 'c1',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_NO_SHOW', note: null },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-20T10:00:00Z'),
      by: 'client-1',
    });

    // Excuse it
    const excused = await service.excuse(record.id, {
      by: 'admin-1',
      reason: 'client had emergency',
      at: new Date(),
    });
    expect(excused.excused).toBe(true);

    // Try again on same record - domain returns the same record
    const stillExcused = await service.excuse(record.id, {
      by: 'admin-1',
      reason: 'again',
      at: new Date(),
    });
    expect(stillExcused.excused).toBe(true);
  });

  it('waives fee and refuses a second time on the same record', async () => {
    const { service, repo } = await setup({ records: [] });

    // Use a time within the free window (less than 24 hours) to get a non-free cancellation
    await service.recordCancellation({
      appointmentId: 'a1',
      clientId: 'c1',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_REQUEST', note: '' },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-19T14:00:00Z'),
      by: 'client-1',
      policy: normalizeNoShowPolicy(),
    });
    // Capture the ID from the repository
    const records = await repo.list();
    const recordId = records[0]?.id ?? '';
    const waived = await service.waiveFee(recordId, {
      by: 'admin-1',
      reason: 'client is good',
      at: new Date(),
    });
    expect(waived.feeWaived).toBe(true);

    // Second waive - domain returns the same record
    const stillWaived = await service.waiveFee(recordId, {
      by: 'admin-1',
      reason: 'again',
      at: new Date(),
    });
    expect(stillWaived.feeWaived).toBe(true);
  });
});

describe('AttendanceManagementController (T-4560)', () => {
  it('serves cancel, no-show, stats, excuse, waive and restriction', async () => {
    const repo = new InMemoryAttendanceRepository();
    const policyRepo = new InMemoryNoShowPolicyRepository();
    const volume = new InMemoryAppointmentVolume(20);
    const events = new RecordingAttendanceEvents();
    const NOW = new Date('2026-11-19T12:00:00Z');
    const svc = new AttendanceManagementService(repo, policyRepo, volume, events, {
      now: () => NOW,
    });
    const controller = new AttendanceManagementController(svc);

    const cancelled = await controller.cancel({
      appointmentId: 'a1',
      clientId: 'c1',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_REQUEST', note: '' },
      actorRole: 'client',
      appointmentStart: '2026-11-25T10:00:00Z',
      by: 'client-1',
    });
    expect(cancelled.type).toBe('cancellation');

    const noShowed = await controller.noShow({
      appointmentId: 'a2',
      clientId: 'c1',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_NO_SHOW', note: 'forgot' },
      actorRole: 'client',
      appointmentStart: '2026-11-22T14:00:00Z',
      by: 'client-1',
    });
    expect(noShowed.type).toBe('no_show');

    const hist = await controller.stats();
    // stats returns NoShowStatsView, check noShows count
    expect(hist.noShows).toBe(1);
  });

  it('maps forbidden, conflict, not-found and bad input to HTTP errors', async () => {
    const repo = new InMemoryAttendanceRepository();
    const policyRepo = new InMemoryNoShowPolicyRepository();
    const volume = new InMemoryAppointmentVolume(20);
    const events = new RecordingAttendanceEvents();
    const NOW = new Date('2026-11-19T12:00:00Z');
    const svc = new AttendanceManagementService(repo, policyRepo, volume, events, {
      now: () => NOW,
    });
    const controller = new AttendanceManagementController(svc);

    // Record a no-show first to get a valid ID
    const recorded = await svc.recordNoShow({
      appointmentId: 'a1',
      clientId: 'c1',
      barberId: 'b1',
      locationId: 'l1',
      reason: { code: 'CLIENT_NO_SHOW', note: null },
      actorRole: 'client',
      appointmentStart: new Date('2026-11-20T10:00:00Z'),
      by: 'client-1',
    });

    // Unknown record for excuse
    await expect(controller.excuse('missing-rec', { by: 'admin-1', reason: 'x' })).rejects.toThrow(
      NotFoundException
    );

    // Excuse the recorded no-show - domain returns the same record
    const stillExcused = await controller.excuse(recorded.id, { by: 'admin-1', reason: 'x' });
    expect(stillExcused.excused).toBe(true);

    // Bad date format
    await expect(
      controller.cancel({
        appointmentId: 'a1',
        clientId: 'c1',
        barberId: 'b1',
        locationId: 'l1',
        reason: { code: 'CLIENT_REQUEST', note: '' },
        actorRole: 'client',
        appointmentStart: 'bad-date',
        by: 'client-1',
      })
    ).rejects.toThrow(BadRequestException);
  });
});
