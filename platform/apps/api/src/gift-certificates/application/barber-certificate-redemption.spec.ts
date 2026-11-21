/* eslint-disable max-lines -- cohesive module (340 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-4456: барбер гасить сертифікат зі сканом/кодом; баланс і
// термін перевіряються, покриття може бути частковим, чек має джерело,
// подвійний скан не списує двічі.
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GiftCertificate } from '../domain/gift-certificate.entity';
import {
  CertificateRedemptionConflictError,
  certificateRedemptionKey,
  normalizeCertificateCode,
  planCertificateRedemption,
} from '../domain/certificate-redemption';
import {
  BarberCertificateRedemptionService,
  InMemoryCertificateRedemptionLedger,
  InMemoryGiftCertificateRepository,
} from './barber-certificate-redemption.service';
import type { GiftCertificateOutbox } from './ports';
import {
  AdminCertificateController,
  BarberCertificateController,
} from '../infrastructure/barber-certificate.controller';

const NOW = new Date('2026-11-19T12:00:00Z');

function certificate(
  overrides: {
    id?: string;
    code?: string;
    amount?: number;
    validityMonths?: number;
    createdAt?: Date;
  } = {}
): GiftCertificate {
  const createdAt = overrides.createdAt ?? NOW;
  const cert = GiftCertificate.createNew({
    id: overrides.id ?? 'cert-1',
    code: overrides.code ?? 'FADE-AAAA-1111',
    initialAmount: overrides.amount ?? 1000,
    validityMonths: overrides.validityMonths ?? 12,
    now: createdAt,
  });
  return cert;
}

function recordingOutbox(): GiftCertificateOutbox & {
  events: Array<{ type: string; payload: Record<string, unknown> }>;
} {
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  return {
    events,
    async append(next) {
      events.push(...next);
    },
  };
}

describe('certificate redemption policy (T-4456)', () => {
  it('normalizes scanned and hand-typed codes', () => {
    expect(normalizeCertificateCode(' fade-aaaa 1111 ')).toBe('FADEAAAA1111');
    expect(normalizeCertificateCode('fade\tAAAA-1111')).toBe('FADEAAAA1111');
    expect(certificateRedemptionKey('fade-aaaa-1111', ' scan-1 ')).toBe(
      'certificate:FADEAAAA1111:scan-1'
    );
  });

  it('rejects non-positive amounts, totals and amounts above the appointment total', () => {
    const cert = certificate();

    expect(() =>
      planCertificateRedemption({ certificate: cert, now: NOW, amount: 0, appointmentTotal: 500 })
    ).toThrow('greater than zero');
    expect(() =>
      planCertificateRedemption({
        certificate: cert,
        now: NOW,
        amount: 100,
        appointmentTotal: 0,
      })
    ).toThrow('Appointment total');
    expect(() =>
      planCertificateRedemption({
        certificate: cert,
        now: NOW,
        amount: 600,
        appointmentTotal: 500,
      })
    ).toThrow('cannot exceed the appointment total');
  });

  it('refuses expired, cancelled and empty certificates', () => {
    const expired = certificate({ validityMonths: 1, createdAt: new Date('2025-01-01T00:00:00Z') });
    expect(() =>
      planCertificateRedemption({
        certificate: expired,
        now: NOW,
        amount: 100,
        appointmentTotal: 500,
      })
    ).toThrow(CertificateRedemptionConflictError);

    const cancelled = certificate({ id: 'cert-2', code: 'FADE-BBBB-2222' });
    cancelled.cancel(NOW);
    expect(() =>
      planCertificateRedemption({
        certificate: cancelled,
        now: NOW,
        amount: 100,
        appointmentTotal: 500,
      })
    ).toThrow('cancelled');

    const empty = certificate({ id: 'cert-3', code: 'FADE-CCCC-3333', amount: 300 });
    empty.redeem(300, NOW);
    expect(() =>
      planCertificateRedemption({
        certificate: empty,
        now: NOW,
        amount: 100,
        appointmentTotal: 500,
      })
    ).toThrow('no balance');
  });

  it('covers part of the appointment or all of it and builds the receipt', () => {
    const partial = planCertificateRedemption({
      certificate: certificate(),
      now: NOW,
      amount: 400,
      appointmentTotal: 1000,
      appointmentId: 'apt-1',
    });
    expect(partial.coveredAmount).toBe(400);
    expect(partial.dueAmount).toBe(600);
    expect(partial.receipt).toEqual({
      source: 'gift_certificate',
      certificateId: 'cert-1',
      certificateCode: 'FADE-AAAA-1111',
      appointmentTotal: 1000,
      coveredAmount: 400,
      dueAmount: 600,
      currency: 'UAH',
      appointmentId: 'apt-1',
    });

    const full = planCertificateRedemption({
      certificate: certificate({ id: 'cert-2', code: 'FADE-DDDD-4444', amount: 2000 }),
      now: NOW,
      amount: 1500,
      appointmentTotal: 1500,
    });
    expect(full.dueAmount).toBe(0);
    expect(full.receipt.appointmentId).toBeNull();
  });

  it('caps coverage at the remaining balance', () => {
    const cert = certificate({ amount: 1000 });
    cert.redeem(700, NOW);

    const plan = planCertificateRedemption({
      certificate: cert,
      now: NOW,
      amount: 500,
      appointmentTotal: 500,
    });
    expect(plan.coveredAmount).toBe(300);
    expect(plan.dueAmount).toBe(200);
  });
});

describe('BarberCertificateRedemptionService (T-4456)', () => {
  async function setup(seed: GiftCertificate[] = [certificate()]) {
    const repository = new InMemoryGiftCertificateRepository();
    for (const cert of seed) await repository.save(cert);
    const outbox = recordingOutbox();
    const ledger = new InMemoryCertificateRedemptionLedger();
    const service = new BarberCertificateRedemptionService(repository, outbox, ledger, {
      now: () => NOW,
    });
    return { repository, outbox, ledger, service };
  }

  const base = {
    actorId: 'barber-1',
    actorRole: 'barber',
    code: 'FADE-AAAA-1111',
    amount: 400,
    appointmentTotal: 1000,
    idempotencyKey: 'scan-1',
  };

  it('redeems a code typed with spaces and emits one redeemed event', async () => {
    const { service, outbox, repository } = await setup();

    const result = await service.redeem({ ...base, code: ' fade aaaa-1111 ' });
    expect(result.coveredAmount).toBe(400);
    expect(result.remainingBalance).toBe(600);
    expect(result.status).toBe('partially_used');
    expect(result.receipt.source).toBe('gift_certificate');
    expect(result.replayed).toBe(false);

    expect(outbox.events).toHaveLength(1);
    expect(outbox?.events?.[0]?.type).toBe('gift-certificate.redeemed');
    expect((await repository.findByCode('FADE-AAAA-1111'))?.remainingBalance).toBe(600);
  });

  it('treats a repeated scan key as the same tranche', async () => {
    const { service, outbox } = await setup();

    const first = await service.redeem(base);
    const replay = await service.redeem({ ...base, code: 'FADEAAAA1111' });

    expect(replay.replayed).toBe(true);
    expect(replay.coveredAmount).toBe(first.coveredAmount);
    expect(replay.remainingBalance).toBe(600);
    expect(outbox.events).toHaveLength(1);
    expect(await service.history({ code: 'FADE-AAAA-1111' })).toHaveLength(1);
  });

  it('allows a second tranche under a different scan key', async () => {
    const { service, outbox } = await setup();
    await service.redeem(base);
    const second = await service.redeem({
      ...base,
      amount: 600,
      appointmentTotal: 600,
      idempotencyKey: 'scan-2',
    });

    expect(second.remainingBalance).toBe(0);
    expect(second.status).toBe('used');
    expect(second.dueAmount).toBe(0);
    expect(outbox.events).toHaveLength(2);
  });

  it('refuses a third redemption after the balance is gone, without emitting events', async () => {
    const { service, outbox } = await setup([certificate({ amount: 500 })]);
    await service.redeem({ ...base, amount: 500, appointmentTotal: 500 });

    await expect(service.redeem({ ...base, idempotencyKey: 'scan-2' })).rejects.toThrow(
      CertificateRedemptionConflictError
    );
    expect(outbox.events).toHaveLength(1);
  });

  it('checks the role, the actor, the code and the scan key', async () => {
    const { service } = await setup();

    await expect(service.redeem({ ...base, actorRole: 'client' })).rejects.toThrow(
      'Only a barber or admin'
    );
    await expect(service.redeem({ ...base, actorId: '  ' })).rejects.toThrow('Barber id');
    await expect(service.redeem({ ...base, code: '  ' })).rejects.toThrow(
      'Certificate code is required'
    );
    await expect(service.redeem({ ...base, idempotencyKey: ' ' })).rejects.toThrow(
      'Idempotency key'
    );
    await expect(service.redeem({ ...base, code: 'UNKNOWN' })).rejects.toThrow('not found');
  });

  it('accepts an admin redemption and records who redeemed', async () => {
    const { service } = await setup();
    const result = await service.redeem({ ...base, actorRole: 'admin', actorId: 'admin-1' });
    expect(result.replayed).toBe(false);

    const [record] = await service.history({ certificateId: 'cert-1' });
    expect(record?.by).toBe('admin-1');
    expect(record?.receipt?.coveredAmount).toBe(400);
  });

  it('reports balance and redeemability before the barber charges', async () => {
    const { service } = await setup([
      certificate({ id: 'cert-live', code: 'FADE-LIVE-0001' }),
      certificate({
        id: 'cert-old',
        code: 'FADE-OLDX-0002',
        validityMonths: 1,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      }),
    ]);

    const live = await service.balance('fade live 0001');
    expect(live).toMatchObject({
      found: true,
      code: 'FADE-LIVE-0001',
      remainingBalance: 1000,
      currency: 'UAH',
      expired: false,
      redeemable: true,
    });

    const old = await service.balance('FADE-OLDX-0002');
    expect(old).toMatchObject({ found: true, expired: true, redeemable: false, status: 'expired' });

    expect(await service.balance('NOPE')).toEqual({ found: false, code: 'NOPE' });
  });

  it('keeps redemption history filterable by certificate and code', async () => {
    const { service } = await setup([
      certificate(),
      certificate({ id: 'cert-2', code: 'FADE-BBBB-2222' }),
    ]);
    await service.redeem(base);
    await service.redeem({
      ...base,
      code: 'FADE-BBBB-2222',
      amount: 100,
      appointmentTotal: 500,
      idempotencyKey: 'scan-2',
    });

    expect(await service.history()).toHaveLength(2);
    expect(await service.history({ certificateId: 'cert-2' })).toHaveLength(1);
    expect(await service.history({ code: 'FADE-BBBB-2222' })).toHaveLength(1);
  });
});

describe('certificate controllers (T-4456)', () => {
  async function setup(seed: GiftCertificate[] = [certificate()]) {
    const repository = new InMemoryGiftCertificateRepository();
    for (const cert of seed) await repository.save(cert);
    const outbox = recordingOutbox();
    const ledger = new InMemoryCertificateRedemptionLedger();
    const service = new BarberCertificateRedemptionService(repository, outbox, ledger, {
      now: () => NOW,
    });
    return {
      barber: new BarberCertificateController(service),
      admin: new AdminCertificateController(service),
      outbox,
    };
  }

  const body = {
    actorId: 'barber-1',
    actorRole: 'barber',
    code: 'FADE-AAAA-1111',
    amount: 400,
    appointmentTotal: 1000,
    appointmentId: 'apt-1',
    idempotencyKey: 'scan-1',
  };

  it('serves redemption, balance and the admin redemption history', async () => {
    const { barber, admin, outbox } = await setup();

    const redeemed = await barber.redeem({ ...body, at: NOW.toISOString() });
    expect(redeemed.receipt.appointmentId).toBe('apt-1');
    expect(outbox.events).toHaveLength(1);

    const balance = await barber.balance('fade aaaa 1111', NOW.toISOString());
    expect(balance.remainingBalance).toBe(600);

    const history = await admin.redemptions('cert-1');
    expect(history).toHaveLength(1);
    expect(history?.[0]?.appointmentId).toBe('apt-1');
  });

  it('maps forbidden, conflict, not-found and bad input to HTTP errors', async () => {
    const { barber } = await setup();

    await expect(barber.redeem({ ...body, actorRole: 'client' })).rejects.toThrow(
      ForbiddenException
    );
    await expect(barber.redeem({ ...body, amount: 5000 })).rejects.toThrow(BadRequestException);
    await expect(barber.redeem({ ...body, code: 'MISSING' })).rejects.toThrow(NotFoundException);
    await expect(barber.balance('FADE-AAAA-1111', 'not-a-date')).rejects.toThrow(
      BadRequestException
    );

    const expired = certificate({
      id: 'cert-old',
      code: 'FADE-OLDX-0002',
      validityMonths: 1,
      createdAt: new Date('2025-01-01T00:00:00Z'),
    });
    const second = await setup([expired]);
    await expect(
      second.barber.redeem({ ...body, code: 'FADE-OLDX-0002', idempotencyKey: 'scan-9' })
    ).rejects.toThrow(ConflictException);
  });
});
