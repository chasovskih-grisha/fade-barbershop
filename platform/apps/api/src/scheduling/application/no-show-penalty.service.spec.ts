/* eslint-disable max-lines -- cohesive module (150 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
import {
  NoShowPenaltyService,
  AppointmentRecord,
  ClientNoShowRecord,
} from './no-show-penalty.service';

describe('NoShowPenaltyService (No-Show Penalty & Staged Response)', () => {
  let service: NoShowPenaltyService;
  const now = new Date('2026-11-12T12:00:00Z');

  beforeEach(() => {
    service = new NoShowPenaltyService();
  });

  it('automatically detects and marks appointment as no_show when past start + autoFixMinutes', () => {
    const appointments: AppointmentRecord[] = [
      {
        id: 'appt-1',
        clientId: 'c-1',
        locationId: 'loc-1',
        barberId: 'b-1',
        start: new Date('2026-11-12T11:30:00Z'), // 30 mins ago (> 15m default threshold)
        status: 'confirmed',
        channel: 'online_with_deposit',
        totalAmount: 1000,
        depositAmount: 300,
      },
      {
        id: 'appt-2',
        clientId: 'c-2',
        locationId: 'loc-1',
        barberId: 'b-1',
        start: new Date('2026-11-12T11:55:00Z'), // 5 mins ago (< 15m threshold)
        status: 'confirmed',
        channel: 'online_with_deposit',
        totalAmount: 1000,
        depositAmount: 300,
      },
    ];

    const { updatedAppointments, audits } = service.evaluateAutoNoShow(appointments, now, 15);

    const item0 = updatedAppointments[0];
    if (!item0) throw new Error('Expected item0');
    expect(item0.status).toBe('no_show');
    const item1 = updatedAppointments[1];
    if (!item1) throw new Error('Expected item1');
    expect(item1.status).toBe('confirmed');

    expect(audits).toHaveLength(1);
    const audit0 = audits[0];
    if (!audit0) throw new Error('Expected audit0');
    expect(audit0.appointmentId).toBe('appt-1');
    expect(audit0.forfeitedDeposit).toBe(300);
    expect(audit0.executedBy).toBe('auto_system');
  });

  it('enforces repeat booking requirement (100% deposit) when client has 2+ no-shows in 90 days', () => {
    const history: ClientNoShowRecord[] = [
      {
        clientId: 'c-problem',
        noShowDates: [new Date('2026-10-01T10:00:00Z'), new Date('2026-10-20T10:00:00Z')],
      },
      {
        clientId: 'c-good',
        noShowDates: [
          new Date('2026-06-01T10:00:00Z'), // > 90 days ago
        ],
      },
    ];

    const checkProblem = service.checkRepeatBookingRequirement('c-problem', history, now, 90, 2);
    expect(checkProblem.requireFullPrepayment).toBe(true);
    expect(checkProblem.recentNoShowCount).toBe(2);

    const checkGood = service.checkRepeatBookingRequirement('c-good', history, now, 90, 2);
    expect(checkGood.requireFullPrepayment).toBe(false);
    expect(checkGood.recentNoShowCount).toBe(0);
  });

  it('respects admin waiver clearing restriction', () => {
    const history: ClientNoShowRecord[] = [
      {
        clientId: 'c-problem',
        noShowDates: [new Date('2026-10-01T10:00:00Z'), new Date('2026-10-20T10:00:00Z')],
      },
    ];

    const rec0 = history[0];
    if (!rec0) throw new Error('Expected record');
    const cleared = service.adminClearRestriction(
      rec0,
      'admin-1',
      'Client explained hospital visit'
    );
    expect(cleared.adminWaiverActive).toBe(true);
    expect(cleared.waiverAdminId).toBe('admin-1');

    const updatedHistory = [cleared];
    const check = service.checkRepeatBookingRequirement('c-problem', updatedHistory, now, 90, 2);
    expect(check.requireFullPrepayment).toBe(false);
    expect(check.waiverActive).toBe(true);
  });

  it('calculates no-show rates sliced by booking channel', () => {
    const appointments: AppointmentRecord[] = [
      {
        id: '1',
        clientId: 'c1',
        locationId: 'l1',
        barberId: 'b1',
        start: new Date(),
        status: 'completed',
        channel: 'online_with_deposit',
        totalAmount: 500,
        depositAmount: 150,
      },
      {
        id: '2',
        clientId: 'c2',
        locationId: 'l1',
        barberId: 'b1',
        start: new Date(),
        status: 'no_show',
        channel: 'online_with_deposit',
        totalAmount: 500,
        depositAmount: 150,
      },
      {
        id: '3',
        clientId: 'c3',
        locationId: 'l1',
        barberId: 'b1',
        start: new Date(),
        status: 'no_show',
        channel: 'online_without_deposit',
        totalAmount: 500,
        depositAmount: 0,
      },
      {
        id: '4',
        clientId: 'c4',
        locationId: 'l1',
        barberId: 'b1',
        start: new Date(),
        status: 'completed',
        channel: 'walk_in',
        totalAmount: 500,
        depositAmount: 0,
      },
    ];

    const rates = service.calculateChannelNoShowRates(appointments);

    expect(rates.online_with_deposit.total).toBe(2);
    expect(rates.online_with_deposit.noShows).toBe(1);
    expect(rates.online_with_deposit.rate).toBe(0.5);

    expect(rates.online_without_deposit.total).toBe(1);
    expect(rates.online_without_deposit.noShows).toBe(1);
    expect(rates.online_without_deposit.rate).toBe(1.0);

    expect(rates.walk_in.total).toBe(1);
    expect(rates.walk_in.noShows).toBe(0);
    expect(rates.walk_in.rate).toBe(0.0);
  });
});
