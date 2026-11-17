import { Booking, BookingConflictError, PaymentStatus } from '../domain/booking';
import { BookingRepository } from '../domain/booking-repository';
import { BarberSchedule } from '../domain/availability';
import { BookAppointment } from './book-appointment.use-case';
import { DepositPolicy } from '../domain/deposit-terms';
import { depositPolicy as defaultDepositPolicy } from './../scheduling/application/deposit-policy';
import { priceSnapshot } from './book-appointment.pricing';
import { compositionDuration } from './../domain/composed-slot-span';
import { withSpan, TRACING } from '../../shared/tracing/tracing';
import type { BookAppointmentDeps } from './book-appointment.types';
export type { BookAppointmentDeps };

/** On-site payment use-case: cash/POS payment at visit, remainder calculation.
 * T-093: On-site payment with idempotency, remainder, and walk-in marking.
 */
export class OnsitePayment {
  constructor(private readonly deps: BookAppointmentDeps) {}

  /** Барбер оплачує візит на місці (cash/POS): сума = FinalPrice, повернута 잔да計算.
   * Викликається з mobile barber app після завершення візиту.
   * Ідемпотентність: якщо платіж вже був capture'd — нічого не робить.
   */
  async execute(booking: Booking): Promise<Booking> {
    return withSpan({
      name: TRACING.ONSITE_PAYMENT,
      options: {
        attributes: {
          'fade.booking.booking_id': booking.id,
          'fade.booking.final_price': booking.finalPrice,
        },
      },
      work: async () => {
        // Check if already paid (ideempotency)
        if (booking.depositStatus === PaymentStatus.Captured) {
          // Already captured - just return, no re-processing
          return booking;
        }

        // Calculate payment amount: FinalPrice minus any already-deposited amount
        const depositAmount = booking.depositAmount ?? 0;
        const paymentAmount = Math.max(0, (booking.finalPrice ?? 0) - depositAmount);

        // Create payment record for on-site payment
        const payment = await this.deps.paymentRepo.create({
          bookingId: booking.id,
          amount: paymentAmount,
          status: PaymentStatus.Initiated,
          paymentMethod: 'cash', // default; UI will override
          source: 'walk-in-booking',
        });

        // Attempt to capture payment
        try {
          const captured = await this.capturePayment(payment, paymentAmount);
          if (captured) {
            // Move booking to confirmed via PaymentCaptured state
            const updated = await this.deps.bookingRepo.update(booking.id, {
              status: 'confirmed',
              depositStatus: PaymentStatus.Captured,
              depositAmount: depositAmount,
              depositPaidAt: new Date(),
              // On-site payment specific: mark as paid on-site
              paymentStatus: PaymentStatus.Captured,
              onsitePaymentDate: new Date(),
            });
            // Fire event for analytics
            if (this.deps.eventBus) {
              await this.deps.eventBus.publish({
                type: 'scheduling.appointment.onsite_payment_captured',
                data: {
                  appointmentId: booking.id,
                  amount: paymentAmount,
                  depositAmount: depositAmount,
                  paymentId: payment.id,
                  paymentMethod: 'cash',
                },
              });
            }
            return updated;
          }
        } catch (error) {
          // Log error, don't block booking
          console.error('On-site payment failed', { bookingId: booking.id, error });
        }

        // Mark payment as failed, keep booking in booked status
        await this.deps.paymentRepo.update(payment.id, { status: PaymentStatus.Failed });
        return booking;
      },
    });
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