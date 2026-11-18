// Залежності клієнтського підтвердження запису (T-041) — окремо від
// контролера, щоб HTTP-файл лишався під гейтом max-lines.
import type { PrismaBookingRepository } from '../infrastructure/prisma-booking.repository';
import type { PrismaAvailabilityRepository } from '../infrastructure/prisma-availability.repository';
import type { PrismaAppointmentRepository } from '../infrastructure/prisma-appointment.repository';
import type { PrismaDepositPolicySettings } from '../infrastructure/prisma-deposit-policy-settings';
import type { PrismaLocationRepository } from '../../locations/infrastructure/prisma-location.repository';
import type { PrismaServiceRepository } from '../../catalog/infrastructure/prisma-service.repository';
import type { EvaluateOnlineBooking } from '../../booking/policy/evaluate-online-booking';
import type { SurgePricing } from '../../pricing/application/surge-quote';

export interface ClientBookingsDeps {
  bookingRepo: PrismaBookingRepository;
  scheduleRepo: PrismaAvailabilityRepository;
  locationRepo: PrismaLocationRepository;
  services: PrismaServiceRepository;
  appointmentRepo: PrismaAppointmentRepository;
  depositPolicy: PrismaDepositPolicySettings;
  /** Політика онлайн-букінгу (T-4542); за відсутності — без обмежень. */
  onlineBooking?: EvaluateOnlineBooking;
  /** Surge-ціноутворення (T-4811); без нього ціна без множника. */
  surge?: SurgePricing;
}
