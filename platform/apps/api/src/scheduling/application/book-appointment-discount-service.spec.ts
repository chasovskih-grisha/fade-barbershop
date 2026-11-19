// Специфікація T-152/T-160: знижки застосовуються у booking-флоу через
// ApplyDiscountService, а 100% промокод доходить до рішення про депозит:
// FinalPrice = 0 → депозиту немає, чека немає, Payment не створюється.
import { PaymentStatus } from '../../billing/domain/payment-status.enum';
import { ApplyDiscountService, type DiscountPorts } from '../../discounts/application/apply-discount.use-case';
import type { PromoCode } from '../../discounts/domain/promo-code';
import {
  WaitlistDepositFlow,
  createInMemoryWaitlistPaymentRepository,
  type DepositCaptureGateway,
  type DepositReceiptIssuer,
} from '../../payment/application/waitlist-deposit-flow.use-case';
import { Booking } from '../domain/booking';
import type { BookingRepository } from '../domain/booking-repository';
import { BarberSchedule } from '../domain/availability';
import { BookAppointment } from './book-appointment.use-case';
import { FakeScheduleRepo, makeOpeningHours, slotOf } from './book-appointment.fakes';

function firstBooking(saved: Booking[]): Booking {
  const [booking] = saved;
  if (!booking) throw new Error('Запис не створено');
  return booking;
}

const date = '2026-10-05';
const PRICE = 40_000; // 400 ₴

function promo(code: string, percent: number): PromoCode {
  return { id: `promo-${code}`, code, value: { kind: 'percent', percent }, active: true };
}

function discountService(codes: PromoCode[]): ApplyDiscountService {
  const ports: DiscountPorts = {
    findPromoCode: async (code) => codes.find((candidate) => candidate.code === code) ?? null,
    promoCodeUsage: async () => ({ total: 0, byClient: 0 }),
    activeRules: async () => [],
    clientDiscountLevel: async () => null,
    hasCompletedVisit: async () => true,
  };
  return new ApplyDiscountService(ports);
}

function harness(codes: PromoCode[], promoCode?: string) {
  const saved: Booking[] = [];
  const repository: BookingRepository = {
    save: async (booking) => {
      saved.push(booking);
    },
    findOverlaps: async () => [],
    findAllOverlaps: async () => [],
    findForBarberAtLocation: async () => [],
    findBarberOverlaps: async () => [],
  };
  const service = discountService(codes);
  const useCase = new BookAppointment({
    bookingRepo: repository,
    scheduleRepo: new FakeScheduleRepo([
      BarberSchedule.create({
        barberId: 'b1',
        locationId: 'loc1',
        windows: [{ dayOfWeek: 0, start: '09:00', end: '18:00' }],
      }),
    ]),
    openingHours: makeOpeningHours(0, '08:00', '20:00'),
    serviceDuration: 30,
    serviceSnapshot: { serviceId: 'cut', agreedPrice: PRICE },
    origin: { clientId: 'client-1' },
    discountApplication: {
      apply: (input) =>
        service.apply({
          agreedPriceCents: input.agreedPriceCents,
          clientId: input.clientId ?? '',
          slotStart: input.slotStart,
          serviceId: input.serviceId,
          promoCode: input.promoCode,
        }),
    },
    ...(promoCode ? { promoCode } : {}),
  });
  return { useCase, saved };
}

describe('booking with ApplyDiscountService (T-152)', () => {
  it('applies a normal promo and keeps the deposit on the discounted price', async () => {
    const { useCase, saved } = harness([promo('INSTAGRAM10', 10)], 'instagram10');

    await useCase.execute('b1', 'loc1', slotOf('13:00', '13:30', date));

    const booking = firstBooking(saved);
    expect(booking.finalPrice).toBe(36_000);
    expect(booking.appliedDiscounts).toEqual([
      { type: 'promo_code', sourceId: 'INSTAGRAM10', amount: 4000 },
    ]);
    expect(booking.requiresPayment).toBe(true);
    expect(booking.deposit).toEqual({
      amount: 10_800, // 30% від 360 ₴
      percent: 30,
      rounding: 10,
      cancellationWindowHours: 4,
    });
  });

  it('takes the free-visit branch on a 100% promo: no deposit, nothing to pay', async () => {
    const { useCase, saved } = harness([promo('FREE100', 100)], 'free100');

    await useCase.execute('b1', 'loc1', slotOf('13:00', '13:30', date));

    const booking = firstBooking(saved);
    expect(booking.finalPrice).toBe(0);
    expect(booking.requiresPayment).toBe(false);
    expect(booking.discountReason).toBe('full_discount_promo');
    expect(booking.deposit).toBeNull();
  });

  it('flows the free visit into the deposit decision: no capture and no receipt', async () => {
    const { useCase, saved } = harness([promo('FREE100', 100)], 'free100');
    await useCase.execute('b1', 'loc1', slotOf('13:00', '13:30', date));
    const booking = firstBooking(saved);

    const capture: DepositCaptureGateway & { calls: number } = {
      calls: 0,
      async capture() {
        this.calls += 1;
        return true;
      },
    };
    const fiscal: DepositReceiptIssuer & { calls: number } = {
      calls: 0,
      async issueReceipt(_bookingId, amount, receiptType) {
        this.calls += 1;
        return { check_id: `check_${amount}`, type: receiptType, amount, status: 'signed', created_at: new Date() };
      },
    };
    const flow = new WaitlistDepositFlow({
      paymentRepo: createInMemoryWaitlistPaymentRepository(),
      paymentGateway: capture,
      checkboxGateway: fiscal,
    });

    const result = await flow.execute({
      waitlistId: 'wl-free',
      clientId: 'client-1',
      slotId: 'slot-1',
      finalPrice: booking.finalPrice ?? 0,
    });

    expect(booking.requiresPayment).toBe(false);
    expect(result.depositAmount).toBe(0);
    expect(result.requiresBalance).toBe(false);
    expect(result.payment.status).toBe(PaymentStatus.PAID);
    expect(result.depositReceipt).toBeNull();
    expect(capture.calls).toBe(0);
    expect(fiscal.calls).toBe(0);
  });
});
