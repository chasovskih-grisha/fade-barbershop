import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
/* eslint-disable max-lines -- deposit access + refund validation share one controller fixture */
import { PaymentController } from './payment.controller';
import type { DepositFlow } from './application/deposit-flow.use-case';
import type { OnsitePayment } from './application/onsite-payment.use-case';
import type { T094Refund } from './application/refund.use-case';
import { depositResumeToken } from '../shared/deposit-resume-token';

beforeAll(() => {
  process.env.DEPOSIT_RESUME_SECRET = 'test-resume-secret';
});
afterAll(() => {
  delete process.env.DEPOSIT_RESUME_SECRET;
});

function controller(refunds: Partial<T094Refund>): PaymentController {
  return new PaymentController(
    {} as DepositFlow,
    {} as OnsitePayment,
    refunds as unknown as T094Refund
  );
}

describe('PaymentController deposit status', () => {
  function depositController(
    clientId: string | null,
    options: { sessionUserId?: string; hold?: unknown } = {}
  ) {
    const prisma = {
      session: {
        findUnique: jest.fn(async () => ({
          userId: options.sessionUserId ?? 'client-1',
          channel: 'web',
          revokedAt: null,
          accessExpiresAt: null,
        })),
      },
    };
    const bookings = {
      findById: jest.fn(async () => ({ id: 'booking-1', clientId })),
    };
    const holds = { find: jest.fn(async () => options.hold ?? null) };
    return new PaymentController(
      {} as DepositFlow,
      {} as OnsitePayment,
      {} as T094Refund,
      bookings as never,
      holds as never,
      prisma as never
    );
  }

  it('requires the owning client session for a named booking', async () => {
    const controller = depositController('client-1');
    await expect(
      controller.depositStatus('booking-1', { cookies: {}, headers: {} } as Request)
    ).rejects.toBeInstanceOf(UnauthorizedException);
    const otherClient = depositController('client-1', { sessionUserId: 'client-2' });
    await expect(
      otherClient.depositStatus('booking-1', {
        cookies: { fadoidx: 'other-token' },
        headers: { Authorization: 'Bearer other-token' },
      } as unknown as Request)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not let the resume token read a named booking', async () => {
    // Токен — капабіліті лише анонімного запису; іменований читає сесія.
    const controller = depositController('client-1');
    await expect(
      controller.depositStatus('booking-1', {
        cookies: {},
        headers: { 'x-deposit-resume-token': depositResumeToken('booking-1') },
      } as unknown as Request)
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requires a signed resume token for anonymous bookings', async () => {
    const controller = depositController(null);
    await expect(
      controller.depositStatus('booking-1', { cookies: {}, headers: {} } as Request)
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      controller.depositStatus('booking-1', {
        cookies: {},
        headers: { 'x-deposit-resume-token': depositResumeToken('booking-1') },
      } as unknown as Request)
    ).resolves.toMatchObject({ status: 'expired' });
  });

  it('returns the read-only reconciliation result', async () => {
    const controller = depositController(null, {
      hold: {
        status: 'active',
        depositAmount: 150,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await expect(
      controller.depositStatus('booking-1', {
        cookies: {},
        headers: { 'x-deposit-resume-token': depositResumeToken('booking-1') },
      } as unknown as Request)
    ).resolves.toMatchObject({ status: 'payable', amount: 150 });
  });
});

describe('PaymentController refund validation', () => {
  it('rejects a fractional or non-positive refund amount before the use case', async () => {
    const refund = controller({ initiateRefund: jest.fn() });

    await expect(
      refund.initiateRefund({ bookingId: 'booking-1', amount: 10.5 })
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      refund.initiateRefund({ bookingId: 'booking-1', amount: 0 })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an empty idempotency key', async () => {
    const refund = controller({ initiateRefund: jest.fn() });

    await expect(
      refund.initiateRefund({ bookingId: 'booking-1', refundId: '  ' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 when the refund does not exist', async () => {
    const refund = controller({ refundStatus: jest.fn(async () => null) });

    await expect(refund.refundStatus('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
