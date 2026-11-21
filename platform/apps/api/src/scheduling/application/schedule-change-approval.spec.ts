/* eslint-disable max-lines -- cohesive module (325 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-4458: заявка на зміну часу → рішення оператора → згода
// клієнта з ідемпотентною подією; конфлікти слота й вікна запису.
import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  PROPOSAL_WINDOW_MINUTES,
  ScheduleChangeConflictError,
  ScheduleChangeError,
  approveRequest,
  confirmAgreement,
  effectiveStatus,
  openChangeRequest,
  rejectRequest,
  validateProposalWindow,
  validateSlot,
  type ScheduleChangeRequest,
  type SlotRef,
} from '../domain/schedule-change-request';
import {
  InMemoryScheduleChangeRepository,
  ScheduleChangeApprovalService,
  type ScheduleChangeAvailability,
  type ScheduleChangeEvents,
} from './schedule-change-approval.service';
import {
  AdminScheduleChangeController,
  ClientScheduleChangeController,
} from '../infrastructure/schedule-change.controller';

const NOW = new Date('2026-11-19T12:00:00Z');
const MINUTE = 60 * 1000;

const CURRENT: SlotRef = { date: '2026-11-20', start: '10:00', end: '11:00' };
const WANTED: SlotRef = { date: '2026-11-21', start: '14:00', end: '15:00' };

function requestWithoutSlot(): ScheduleChangeRequest {
  return openChangeRequest({
    id: 'req-noslot',
    appointmentId: 'apt-1',
    clientId: 'c-1',
    currentSlot: CURRENT,
    at: NOW,
  });
}

function request(overrides: Partial<ScheduleChangeRequest> = {}): ScheduleChangeRequest {
  return {
    ...openChangeRequest({
      id: 'req-1',
      appointmentId: 'apt-1',
      clientId: 'c-1',
      currentSlot: CURRENT,
      requestedSlot: WANTED,
      at: NOW,
    }),
    ...overrides,
  };
}

function harness(options: { available?: boolean; failAppend?: boolean } = {}) {
  const repository = new InMemoryScheduleChangeRepository();
  const appended: Array<{ eventId: string }> = [];
  const events: ScheduleChangeEvents = {
    async append(event) {
      if (options.failAppend) throw new Error('outbox unavailable');
      if (!appended.some((item) => item.eventId === event.payload.eventId)) {
        appended.push({ eventId: event.payload.eventId });
      }
    },
  };
  const availability: ScheduleChangeAvailability = {
    async isSlotAvailable() {
      return options.available ?? true;
    },
  };
  return {
    repository,
    appended,
    service: new ScheduleChangeApprovalService(repository, events, availability, {
      now: () => NOW,
    }),
  };
}

describe('schedule change request policy (T-4458)', () => {
  it('validates slot shapes and refuses a request for the current slot', () => {
    expect(validateSlot({ date: '20-11-2026', start: '10:00', end: '11:00' })).toHaveLength(1);
    expect(validateSlot({ date: '2026-11-20', start: '9:00', end: '11:00' })).toHaveLength(1);
    expect(validateSlot({ date: '2026-11-20', start: '12:00', end: '11:00' })).toHaveLength(1);
    expect(validateSlot(CURRENT)).toEqual([]);

    expect(() =>
      openChangeRequest({
        id: 'req-x',
        appointmentId: 'apt-1',
        clientId: 'c-1',
        currentSlot: CURRENT,
        requestedSlot: { ...CURRENT },
      })
    ).toThrow('already the appointment slot');
  });

  it('checks the proposal against the booking window and the past', () => {
    expect(validateProposalWindow(WANTED, { now: NOW, bookingWindowDays: 60 })).toEqual([]);
    expect(
      validateProposalWindow({ ...WANTED, date: '2026-11-01' }, { now: NOW, bookingWindowDays: 60 })
    ).toContain('Proposed slot is in the past');
    expect(
      validateProposalWindow({ ...WANTED, date: '2027-02-01' }, { now: NOW, bookingWindowDays: 60 })
    ).toEqual([expect.stringContaining('beyond the 60-day booking window')]);
  });

  it('approves with a hold, falling back to the client-requested slot', () => {
    const approved = approveRequest(request(), { by: 'admin-1', at: NOW });

    expect(approved.status).toBe('approved');
    expect(approved.proposal?.slot).toEqual(WANTED);
    expect(approved.proposal?.expiresAt).toEqual(
      new Date(NOW.getTime() + PROPOSAL_WINDOW_MINUTES * MINUTE)
    );
    expect(approved.proposal?.by).toBe('admin-1');
  });

  it('approves an operator-proposed slot and refuses a second decision', () => {
    const alternative: SlotRef = { date: '2026-11-22', start: '09:00', end: '10:00' };
    const approved = approveRequest(request(), { by: 'admin-1', slot: alternative, at: NOW });
    expect(approved.proposal?.slot).toEqual(alternative);

    expect(() => approveRequest(approved, { by: 'admin-1', at: NOW })).toThrow(
      ScheduleChangeConflictError
    );
    expect(() => approveRequest(request(), { by: '  ', at: NOW })).toThrow(ScheduleChangeError);
    expect(() => approveRequest(requestWithoutSlot(), { by: 'admin-1' })).toThrow('proposed slot');
    expect(() =>
      approveRequest(requestWithoutSlot(), {
        by: 'admin-1',
        slot: { ...CURRENT },
        at: NOW,
      })
    ).toThrow('equals the current');
  });

  it('rejects with a reason and an optional alternative', () => {
    const alternative: SlotRef = { date: '2026-11-23', start: '16:00', end: '17:00' };
    const rejected = rejectRequest(request(), {
      by: 'admin-1',
      reason: 'немає вікна у барбера',
      alternativeSlot: alternative,
      at: NOW,
    });

    expect(rejected.status).toBe('rejected');
    expect(rejected.rejection).toMatchObject({ reason: 'немає вікна у барбера' });
    expect(rejected.rejection?.alternativeSlot).toEqual(alternative);

    expect(() => rejectRequest(request(), { by: 'admin-1', reason: ' ' })).toThrow(
      'requires a reason'
    );
    expect(() => rejectRequest(rejected, { by: 'admin-1', reason: 'x' })).toThrow(
      ScheduleChangeConflictError
    );
  });

  it('expires the proposal after the hold window without changing the stored status', () => {
    const approved = approveRequest(request(), { by: 'admin-1', at: NOW });
    const later = new Date(NOW.getTime() + (PROPOSAL_WINDOW_MINUTES + 1) * MINUTE);

    expect(effectiveStatus(approved, NOW)).toBe('approved');
    expect(effectiveStatus(approved, later)).toBe('expired');
    expect(approved.status).toBe('approved');
  });
});

describe('client agreement (T-4458)', () => {
  function approved(): ScheduleChangeRequest {
    return approveRequest(request(), { by: 'admin-1', at: NOW });
  }

  it('records one confirmation event for the first call and none for the retry', () => {
    const first = confirmAgreement(approved(), { clientId: 'c-1', eventId: 'evt-1', at: NOW });

    expect(first.alreadyConfirmed).toBe(false);
    expect(first.request.status).toBe('confirmed');
    expect(first.event).toEqual({
      type: 'scheduling.appointment.change_confirmed',
      payload: {
        requestId: 'req-1',
        appointmentId: 'apt-1',
        clientId: 'c-1',
        eventId: 'evt-1',
        from: CURRENT,
        to: WANTED,
      },
    });

    const retry = confirmAgreement(first.request, {
      clientId: 'c-1',
      eventId: 'evt-1',
      at: NOW,
    });
    expect(retry.alreadyConfirmed).toBe(true);
    expect(retry.event).toBeNull();
    expect(retry.request).toBe(first.request);
  });

  it('refuses other clients, unapproved requests and a second event id', () => {
    expect(() =>
      confirmAgreement(approved(), { clientId: 'c-2', eventId: 'evt-1', at: NOW })
    ).toThrow('Only the requesting client');

    expect(() =>
      confirmAgreement(request(), { clientId: 'c-1', eventId: 'evt-1', at: NOW })
    ).toThrow('Only an approved change');

    const confirmed = confirmAgreement(approved(), {
      clientId: 'c-1',
      eventId: 'evt-1',
      at: NOW,
    }).request;
    expect(() =>
      confirmAgreement(confirmed, { clientId: 'c-1', eventId: 'evt-2', at: NOW })
    ).toThrow('already confirmed');
  });

  it('rejects confirmation of an expired proposal or a taken slot', () => {
    const later = new Date(NOW.getTime() + (PROPOSAL_WINDOW_MINUTES + 1) * MINUTE);
    expect(() =>
      confirmAgreement(approved(), { clientId: 'c-1', eventId: 'evt-1', at: later })
    ).toThrow('Proposal expired');

    expect(() =>
      confirmAgreement(approved(), { clientId: 'c-1', eventId: 'evt-1', at: NOW, slotTaken: true })
    ).toThrow('no longer available');
  });
});

describe('ScheduleChangeApprovalService (T-4458)', () => {
  it('registers a request idempotently and lists by effective status', async () => {
    const { service } = harness();
    const created = await service.request({
      id: 'req-1',
      appointmentId: 'apt-1',
      clientId: 'c-1',
      currentSlot: CURRENT,
      requestedSlot: WANTED,
      at: NOW,
    });
    const again = await service.request({
      id: 'req-1',
      appointmentId: 'apt-1',
      clientId: 'c-1',
      currentSlot: CURRENT,
      at: NOW,
    });

    expect(again).toEqual(created);
    expect((await service.list({}, NOW)).map((view) => view.status)).toEqual(['requested']);

    await service.approve('req-1', { by: 'admin-1', at: NOW });
    expect(await service.list({ status: 'requested' }, NOW)).toEqual([]);
    expect(await service.list({ status: 'approved' }, NOW)).toHaveLength(1);
  });

  it('does not approve onto an occupied slot and leaves the request requested', async () => {
    const { service, repository } = harness({ available: false });
    await service.request({
      id: 'req-1',
      appointmentId: 'apt-1',
      clientId: 'c-1',
      currentSlot: CURRENT,
      requestedSlot: WANTED,
      at: NOW,
    });

    await expect(service.approve('req-1', { by: 'admin-1', at: NOW })).rejects.toThrow(
      'no longer available'
    );
    expect((await repository.findById('req-1'))?.status).toBe('requested');
  });

  it('confirms once, persists the agreement and appends exactly one event', async () => {
    const { service, appended, repository } = harness();
    await service.request({
      id: 'req-1',
      appointmentId: 'apt-1',
      clientId: 'c-1',
      currentSlot: CURRENT,
      requestedSlot: WANTED,
      at: NOW,
    });
    await service.approve('req-1', { by: 'admin-1', at: NOW });

    const first = await service.confirm('req-1', { clientId: 'c-1', eventId: 'evt-1', at: NOW });
    const retry = await service.confirm('req-1', { clientId: 'c-1', eventId: 'evt-1', at: NOW });

    expect(first).toMatchObject({ alreadyConfirmed: false, eventEmitted: true });
    expect(retry).toMatchObject({ alreadyConfirmed: true, eventEmitted: false });
    expect(appended).toEqual([{ eventId: 'evt-1' }]);
    expect((await repository.findById('req-1'))?.status).toBe('confirmed');
  });

  it('reports unknown requests and surfaces outbox failures', async () => {
    const { service } = harness({ failAppend: true });
    await expect(service.get('missing')).rejects.toThrow('not found');

    await service.request({
      id: 'req-1',
      appointmentId: 'apt-1',
      clientId: 'c-1',
      currentSlot: CURRENT,
      requestedSlot: WANTED,
      at: NOW,
    });
    await service.approve('req-1', { by: 'admin-1', at: NOW });
    await expect(
      service.confirm('req-1', { clientId: 'c-1', eventId: 'evt-1', at: NOW })
    ).rejects.toThrow('outbox unavailable');
  });
});

describe('schedule change controllers (T-4458)', () => {
  it('serves the client request and confirmation', async () => {
    const { service } = harness();
    const client = new ClientScheduleChangeController(service);

    const created = await client.request({
      id: 'req-1',
      appointmentId: 'apt-1',
      clientId: 'c-1',
      currentSlot: CURRENT,
      requestedSlot: WANTED,
    });
    expect(created.status).toBe('requested');

    await service.approve('req-1', { by: 'admin-1', at: NOW });
    const confirmed = await client.confirm('req-1', { clientId: 'c-1', eventId: 'evt-1' });
    expect(confirmed.request.status).toBe('confirmed');
  });

  it('serves the admin list, approval and rejection, mapping errors', async () => {
    const { service } = harness();
    const admin = new AdminScheduleChangeController(service);

    await service.request({
      id: 'req-1',
      appointmentId: 'apt-1',
      clientId: 'c-1',
      currentSlot: CURRENT,
      requestedSlot: WANTED,
      at: NOW,
    });

    expect((await admin.list()).total).toBe(1);
    expect((await admin.approve('req-1', { by: 'admin-1' })).status).toBe('approved');
    expect((await admin.get('req-1')).proposal?.slot).toEqual(WANTED);

    await expect(admin.get('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(admin.approve('req-1', { by: 'admin-1' })).rejects.toBeInstanceOf(
      ConflictException
    );

    await service.request({
      id: 'req-2',
      appointmentId: 'apt-2',
      clientId: 'c-2',
      currentSlot: CURRENT,
      at: NOW,
    });
    const rejected = await admin.reject('req-2', { by: 'admin-1', reason: 'зайнято' });
    expect(rejected.status).toBe('rejected');
  });
});
