// Типи подій лояльності, які споживає outbox-релей (T-141/T-143).
// Тримаємо окремо від домену: це контракт маршрутизації, а не модель.
export const LOYALTY_INCREMENTED_TYPE = 'loyalty.points.incremented';
export const LOYALTY_GRANTED_TYPE = 'loyalty.free_visit.granted';
