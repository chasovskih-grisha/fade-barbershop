// Дашборд запуску (T-4439): перші дні після відкриття CLT-01. Тут лише числа
// й пороги гейтів — джерела даних живуть в application/infrastructure.
// «Чи все витримало» = доставка каналів і частка 5xx, а не кількість записів:
// чистий API без SMS виглядав би зеленим.

export interface LaunchCounters {
  /** Активні локації на момент запиту (снапшот, не вікно). */
  locationsOnline: number;
  clientsCreated: number;
  bookingsCreated: number;
  noShows: number;
  paymentsCaptured: number;
  receiptsIssued: number;
  /** SMS: спроби = надіслані + пропущені; доставлені = статус sent. */
  smsAttempted: number;
  smsDelivered: number;
  pushAttempted: number;
  pushDelivered: number;
  httpRequests: number;
  serverErrors: number;
}

/** Гейт запуску: доставка каналів ≥ 95% (T-4439 Done). */
export const DELIVERY_MIN = 0.95;
/** Гейт запуску: частка 5xx < 3% (T-4439 Done). */
export const SERVER_ERROR_MAX = 0.03;

export interface LaunchGate {
  key: 'delivery' | 'serverErrors';
  label: string;
  value: number;
  threshold: number;
  ok: boolean;
}

export interface LaunchGates {
  delivery: LaunchGate;
  serverErrors: LaunchGate;
  ok: boolean;
}

export function deliveryRate(counters: LaunchCounters): number {
  const attempted = counters.smsAttempted + counters.pushAttempted;
  if (attempted === 0) return 1;
  return (counters.smsDelivered + counters.pushDelivered) / attempted;
}

export function serverErrorRate(counters: LaunchCounters): number {
  if (counters.httpRequests === 0) return 0;
  return counters.serverErrors / counters.httpRequests;
}

export function launchGates(counters: LaunchCounters): LaunchGates {
  const delivery = deliveryRate(counters);
  const serverErrors = serverErrorRate(counters);
  const deliveryGate: LaunchGate = {
    key: 'delivery',
    label: 'Доставка SMS + push',
    value: delivery,
    threshold: DELIVERY_MIN,
    ok: delivery >= DELIVERY_MIN,
  };
  const serverErrorGate: LaunchGate = {
    key: 'serverErrors',
    label: 'Частка 5xx',
    value: serverErrors,
    threshold: SERVER_ERROR_MAX,
    ok: serverErrors < SERVER_ERROR_MAX,
  };
  return {
    delivery: deliveryGate,
    serverErrors: serverErrorGate,
    ok: deliveryGate.ok && serverErrorGate.ok,
  };
}
