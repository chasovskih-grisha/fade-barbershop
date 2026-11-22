import { Payment } from '../../billing/domain/payment.entity';
import { PaymentForm, PaymentStatus } from '../../billing/domain/payment-status.enum';
import { PrismaAppointmentPaymentRepository } from './prisma-appointment-payment.repository';
import type { PrismaService } from '../../shared/prisma/prisma.service';

function prismaStub() {
  return {
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };
}

function payment(): Payment {
  return new Payment({
    id: 'pay-1',
    appointmentId: 'appt-1',
    clientId: 'client-1',
    amount: 300,
    form: PaymentForm.CARD,
    status: PaymentStatus.AWAITING_DEPOSIT,
    traceId: 'trace-1',
    createdAt: new Date('2026-11-01T10:00:00Z'),
    updatedAt: new Date('2026-11-01T10:00:00Z'),
  });
}

describe('PrismaAppointmentPaymentRepository', () => {
  it('restores a payment entity from a row', async () => {
    const prisma = prismaStub();
    prisma.payment.findUnique.mockResolvedValue({
      id: 'pay-1',
      appointmentId: 'appt-1',
      orderId: null,
      clientId: null,
      amount: 300,
      form: 'card',
      status: 'awaiting_deposit',
      traceId: 'trace-1',
      receiptId: null,
      refundReason: null,
      refundedAmount: 0,
      retryCount: 0,
      createdAt: new Date('2026-11-01T10:00:00Z'),
      updatedAt: new Date('2026-11-01T10:00:00Z'),
    });

    const repo = new PrismaAppointmentPaymentRepository(prisma as unknown as PrismaService);
    const found = await repo.findById('pay-1');

    expect(found?.toJSON()).toMatchObject({
      id: 'pay-1',
      appointmentId: 'appt-1',
      clientId: '',
      amount: 300,
      form: PaymentForm.CARD,
      status: PaymentStatus.AWAITING_DEPOSIT,
    });
  });

  it('upserts the entity and maps empty client ids to null', async () => {
    const prisma = prismaStub();
    prisma.payment.upsert.mockResolvedValue({});
    const repo = new PrismaAppointmentPaymentRepository(prisma as unknown as PrismaService);
    const entity = payment();
    entity.markDepositPaid('check-1');

    await repo.save(entity);

    expect(prisma.payment.upsert).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      create: expect.objectContaining({
        id: 'pay-1',
        clientId: 'client-1',
        status: PaymentStatus.DEPOSIT_PAID,
        receiptId: 'check-1',
      }),
      update: expect.objectContaining({ status: PaymentStatus.DEPOSIT_PAID }),
    });
  });

  it('filters by appointment', async () => {
    const prisma = prismaStub();
    prisma.payment.findMany.mockResolvedValue([]);
    const repo = new PrismaAppointmentPaymentRepository(prisma as unknown as PrismaService);

    await expect(repo.findByAppointmentId('appt-1')).resolves.toEqual([]);
    expect(prisma.payment.findMany).toHaveBeenCalledWith({
      where: { appointmentId: 'appt-1' },
      orderBy: { createdAt: 'asc' },
    });
  });
});
