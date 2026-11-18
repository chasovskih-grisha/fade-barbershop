// Матриця «барбер × послуга» (T-4521): спільне правило, за яким послугу
// локації виконують лише призначені барбери. Порожня матриця (або жоден
// призначений не виконує послугу) — фолбек «усі барбери локації» (дефолт
// «все», MNG-ADM-05). Домен без Nest/Prisma/HTTP.
import type { BarberServiceAssignmentSnapshot } from './ports.barber-service-assignment';

/** { barberId: { locationId: Set<serviceId> } } — форма снапшота матриці. */
export type BarberServiceMatrix = BarberServiceAssignmentSnapshot['matrix'];

/** Барбери, які виконують `serviceId` у `locationId`; без збігів → `fallback`. */
export function barbersForService(
  matrix: BarberServiceMatrix,
  input: { locationId: string; serviceId: string },
  fallback: Iterable<string>
): Set<string> {
  const { locationId, serviceId } = input;
  const result = new Set<string>();
  for (const [barberId, byLocation] of matrix) {
    if (byLocation.get(locationId)?.has(serviceId)) result.add(barberId);
  }
  return result.size > 0 ? result : new Set(fallback);
}
