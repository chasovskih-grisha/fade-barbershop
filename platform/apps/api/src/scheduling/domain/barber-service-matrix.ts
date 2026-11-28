// Матриця «барбер × послуга» (T-4521): спільне правило, за яким послугу
// локації виконують лише призначені барбери. Порожня матриця (або жоден
// призначений не виконує послугу) — фолбек «усі барбери локації» (дефолт
// «все», MNG-ADM-05). Домен без Nest/Prisma/HTTP.
import type { BarberServiceAssignmentSnapshot } from './ports.barber-service-assignment';

/** { barberId: { locationId: Set<serviceId> } } — форма снапшота матриці. */
export type BarberServiceMatrix = BarberServiceAssignmentSnapshot['matrix'];

/**
 * Зі списку `barberIds` — ті, яких матриця не допускає до `serviceId` у локації.
 * Порожній результат означає «усі допущені» (фолбек порожньої матриці — дефолт
 * «барбер виконує всі активні послуги локації»). Потрібно там, де барберів уже
 * обрано (партія «батько і син», T-044): пара стоїть лише в майстрів зі спільною
 * послугою, інакше клієнт записався б до того, хто послугу не робить.
 */
export function barbersOutsideService(
  matrix: BarberServiceMatrix,
  input: { locationId: string; serviceId: string; barberIds: Iterable<string> }
): string[] {
  const wanted = [...new Set(input.barberIds)];
  const allowed = barbersForService(
    matrix,
    { locationId: input.locationId, serviceId: input.serviceId },
    wanted
  );
  return wanted.filter((barberId) => !allowed.has(barberId));
}

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
