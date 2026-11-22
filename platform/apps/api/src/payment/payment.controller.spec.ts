import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import type { DepositFlow } from './application/deposit-flow.use-case';
import type { OnsitePayment } from './application/onsite-payment.use-case';
import type { T094Refund } from './application/refund.use-case';

function controller(refunds: Partial<T094Refund>): PaymentController {
  return new PaymentController(
    {} as DepositFlow,
    {} as OnsitePayment,
    refunds as unknown as T094Refund
  );
}

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
