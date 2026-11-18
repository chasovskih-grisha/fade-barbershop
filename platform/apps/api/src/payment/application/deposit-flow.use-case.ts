import { Booking, BookingConflictError, PaymentStatus } from '../../scheduling/domain/booking';
import { BookingRepository } from '../../scheduling/domain/booking-repository';
import { BarberSchedule } from '../../scheduling/domain/availability';
import { BookAppointment } from '../../scheduling/application/book-appointment.use-case';
import { DepositPolicy } from '../../scheduling/domain/deposit-terms';
import { depositPolicy as defaultDepositPolicy } from '../../scheduling/application/deposit-policy';
import { priceSnapshot } from '../../scheduling/application/book-appointment.pricing';
import { compositionDuration } from '../../scheduling/domain/composed-slot-span';
import { withSpan, TRACING } from '../../shared/tracing/tracing';
import type { BookAppointmentDeps } from '../../scheduling/application/book-appointment.types';

export type { BookAppointmentDeps };

/** Deposit flow use-case: 30% deposit on booking, idempotent, rounding 10 UAH.
 * T-091: Deposit flow with statuses, cabinet checks, and FinalPrice=0 handling.
 */

export class DepositFlow {
  constructor(private readonly deps: BookAppointmentDeps) {}

  /** АВТОМАТИЧНИЙ депозит при записі: 30% від FinalPrice, округлення 10 грн.
   * Викликається з book-appointment.use-case.execute після успішного запису.
   * Ідемпотентність: якщо депозит уже оплачений — нічого не робить.
   */
  async execute(booking: Booking): Promise<Booking> {
    return withSpan({
      name: TRACING.DEPOSIT_FLOW,
      options: {
        attributes: {
          'fade.booking.booking_id': booking.id,
          'fade.booking.final_price': booking.finalPrice,
        },
      },
      work: async () => {
        // Check if deposit already paid (ideempotency)
        if (booking.depositStatus === PaymentStatus.Captured) {
          return booking;
        }

        const depositPolicy = await this.deps.depositPolicy?.get() ?? defaultDepositPolicy;
        const depositAmount = this.calculateDepositAmount(booking.finalPrice, depositPolicy);

        // Create payment record
        const payment = await this.deps.paymentRepo.create({
          bookingId: booking.id,
          amount: depositAmount,
          status: PaymentStatus.Initiated,
          paymentMethod: 'cash', // default; UI will override
          source: 'walk-in-booking',
        });

        // Attempt to capture payment
        try {
          const captured = await this.capturePayment(payment, depositAmount);
          if (captured) {
            // Move booking to confirmed via PaymentCaptured state
            const updated = await this.deps.bookingRepo.update(booking.id, {
              status: 'confirmed',
              depositStatus: PaymentStatus.Captured,
              depositAmount: depositAmount,
              depositPaidAt: new Date(),
            });
            // Fire event for analytics
            if (this.deps.eventBus) {
              await this.deps.eventBus.publish({
                type: 'scheduling.appointment.payment_captured',
                data: {
                  appointmentId: booking.id,
                  amount: depositAmount,
                  paymentId: payment.id,
                },
              });
            }
            return updated;
          }
        } catch (error) {
          // Mark payment as failed, keep booking in booked status
          await this.deps.paymentRepo.update(payment.id, { status: PaymentStatus.Failed });
          // Don't throw - allow booking without deposit (ComplimentaryVisit path)
          return booking;
        }
      },
    });
  }

  private calculateDepositAmount(finalPrice: number | null, policy: DepositPolicy): number {
    if (finalPrice == null || finalPrice <= 0) return 0;
    const rawDeposit = Math.round((finalPrice * policy.depositPercent) / 100);
    // Rounding to 10 UAH (PAY-ADM-09)
    const roundedDeposit = Math.round(rawDeposit / 10) * 10;
    // Cap at FinalPrice (can't deposit more than total)
    return Math.min(roundedDeposit, finalPrice);
  }

  private async capturePayment(payment: any, amount: number): Promise<boolean> {
    // Idempotency check: if already captured, return true
    if (payment.status === PaymentStatus.Captured) return true;

    // Simulate payment gateway call
    // In production: call actual PAY provider API
    const success = await this.simulatePaymentGateway(payment, amount);

    if (success) {
      await this.deps.paymentRepo.update(payment.id, { status: PaymentStatus.Captured });
      return true;
    }

    // Log error, don't block booking
    console.error('Payment gateway failed', { paymentId: payment.id, amount });
    return false;
  }

  private async simulatePaymentGateway(payment: any, amount: number): Promise<boolean> {
    // 90% success rate for simulation
    // Real implementation would call PAY provider API
    return Math.random() > 0.1;
  }
}


