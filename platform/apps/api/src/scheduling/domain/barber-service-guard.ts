// Серверна перевірка кроку 2 флоу запису (T-041 + T-4521): клієнтський UI
// ховає барберів без послуги, але HTTP-запит можна надіслати напряму, тож
// підтвердження має саме відмовити, а не створити візит «слот є, барбер не
// виконує послугу». Порожня матриця (дефолт «все») нікого не блокує.
import { barbersForService } from './barber-service-matrix';
import type { BarberServiceMatrix } from './barber-service-matrix';

export interface BarberServiceRequest {
  locationId: string;
  barberId: string;
  serviceId: string;
}

/** Чи виконує барбер послугу в локації за снапшотом матриці. */
export function barberPerformsService(
  matrix: BarberServiceMatrix,
  { locationId, barberId, serviceId }: BarberServiceRequest
): boolean {
  const assigned = barbersForService(matrix, { locationId, serviceId }, []);
  return assigned.size === 0 || assigned.has(barberId);
}
