// Доменний бар'єр: сервіси, що не належать жодному модулю (waitlist, loyalty,
// feedback, discounts), читають сутності звідси, а не з чужих модулів.
export { Location } from '../locations/domain/location';
export { StaffAssignment } from '../locations/domain/staff-assignment';
export { Service } from '../catalog/domain/service';
export { Booking } from '../scheduling/domain/booking';
export { Appointment } from '../scheduling/domain/appointment.aggregate';
export { ClientProfile } from '../crm/domain/client-profile';
export { AppointmentParty } from '../appointment-party/domain/appointment-party.entity';
export type { OnlineBookingPolicy } from '../booking/policy/online-booking-policy';

/** Ціна послуги в локації (T-4401): amount у мінімальних одиницях валюти. */
export interface ServicePrice {
  serviceId: string;
  amount: number;
  active: boolean;
}

/** Привʼязка барбера до послуги (T-4420): хто що виконує і де. */
export interface BarberServiceAssignment {
  barberId: string;
  serviceId: string;
  locationId?: string | null;
}
