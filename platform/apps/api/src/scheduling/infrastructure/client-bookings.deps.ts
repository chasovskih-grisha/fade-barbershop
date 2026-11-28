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
import type { DepositHoldService } from '../application/deposit-hold.service';
import type { DayOffRepository } from '../domain/day-off';

export interface ClientBookingsDeps {
  bookingRepo: PrismaBookingRepository;
  scheduleRepo: PrismaAvailabilityRepository;
  locationRepo: PrismaLocationRepository;
  services: PrismaServiceRepository;
  appointmentRepo: PrismaAppointmentRepository;
  depositPolicy: PrismaDepositPolicySettings;
  /** T-4447: вихідні барбера; за відсутності порту перевірки немає. */
  dayOffs?: DayOffRepository;
  /** Політика онлайн-букінгу (T-4542); за відсутності — без обмежень. */
  onlineBooking?: EvaluateOnlineBooking;
  /** Surge-ціноутворення (T-4811); без нього ціна без множника. */
  surge?: SurgePricing;
  /** T-4619a/T-4619b: утримання крісла і серверний дедлайн для клієнта. */
  depositHolds?: Pick<DepositHoldService, 'open' | 'find'>;
  /** T-4616a: недоступність барбера блокує новий запис. */
  unavailable?: Pick<import('../domain/shift-conflict-ports').BarberUnavailabilityRepository, 'covers'>;
  /** T-041/T-4521: матриця «барбер × послуга»; без порту обмеження немає. */
  barberServices?: Pick<
    import('../domain/ports.barber-service-assignment').BarberServiceAssignmentRepository,
    'snapshotForLocation'
  >;
}
