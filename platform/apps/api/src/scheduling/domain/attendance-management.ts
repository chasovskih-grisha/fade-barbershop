/* eslint-disable max-lines, complexity -- cohesive module (513 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 function with inherent domain branching (worst: normalizeNoShowPolicy, complexity 12 vs 10); refactor tracked in T-2500f */
/**
 * T-4560: no-show і скасування — причини, вікно безкоштовного скасування,
 * депозит для ризикованих клієнтів, статистика й ручні винятки.
 *
 * Правила тут (без Nest/Prisma/HTTP):
 *  - причина скасування обов'язкова; `OTHER` вимагає вільного тексту;
 *  - скасування з боку салону/барбера й погода — завжди безкоштовні;
 *  - пізнє скасування (менше `freeCancelHours` до візиту) утримує депозит
 *    на `lateCancelFeePercent`, адмін може зняти утримання вручну;
 *  - N невиправданих no-show за M днів → повний депозит і блокування
 *    онлайн-запису; «excused» випадки не рахуються;
 *  - адмін може зняти рестрикцію й повернути депозит (аудит у записі).
 *
 * Час передається явно; статистика групується в таймзоні салону.
 */

export type CancellationReasonCode =
  | 'CLIENT_REQUEST'
  | 'CLIENT_SICK'
  | 'CLIENT_SCHEDULE'
  | 'BARBER_SICK'
  | 'BARBER_VACATION'
  | 'SALON_CLOSED'
  | 'WEATHER'
  | 'OTHER';

export type NoShowReasonCode = 'CLIENT_NO_SHOW' | 'CLIENT_LATE' | 'WRONG_TIME' | 'OTHER';

export type CancellationActorRole = 'client' | 'barber' | 'admin';
export type AttendanceType = 'cancellation' | 'no_show';

export const CANCELLATION_REASON_CODES: readonly CancellationReasonCode[] = [
  'CLIENT_REQUEST',
  'CLIENT_SICK',
  'CLIENT_SCHEDULE',
  'BARBER_SICK',
  'BARBER_VACATION',
  'SALON_CLOSED',
  'WEATHER',
  'OTHER',
];

export const NO_SHOW_REASON_CODES: readonly NoShowReasonCode[] = [
  'CLIENT_NO_SHOW',
  'CLIENT_LATE',
  'WRONG_TIME',
  'OTHER',
];

/** Причини, за яких клієнт не платить нічого, незалежно від часу. */
const SALON_SIDE_REASONS: readonly CancellationReasonCode[] = [
  'BARBER_SICK',
  'BARBER_VACATION',
  'SALON_CLOSED',
  'WEATHER',
];

export const DEFAULT_ATTENDANCE_TIME_ZONE = 'Europe/Kyiv';

export class AttendanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttendanceError';
  }
}

export class AttendanceConflictError extends AttendanceError {
  constructor(message: string) {
    super(message);
    this.name = 'AttendanceConflictError';
  }
}

export interface Reason {
  code: string;
  note: string | null;
}

export interface NoShowPolicy {
  locationId: string;
  /** null — політика для всієї локації; інакше — оверрайд послуги. */
  serviceId: string | null;
  freeCancelHours: number;
  lateCancelFeePercent: number;
  depositForHighRisk: boolean;
  highRiskThreshold: { count: number; days: number };
}

export const DEFAULT_NO_SHOW_POLICY: NoShowPolicy = {
  locationId: '*',
  serviceId: null,
  freeCancelHours: 24,
  lateCancelFeePercent: 50,
  depositForHighRisk: true,
  highRiskThreshold: { count: 3, days: 90 },
};

export function normalizeNoShowPolicy(overrides: Partial<NoShowPolicy> = {}): NoShowPolicy {
  const policy: NoShowPolicy = {
    ...DEFAULT_NO_SHOW_POLICY,
    ...overrides,
    highRiskThreshold: {
      ...DEFAULT_NO_SHOW_POLICY.highRiskThreshold,
      ...(overrides.highRiskThreshold ?? {}),
    },
  };

  if (!policy.locationId.trim()) throw new AttendanceError('locationId is required');
  if (!Number.isFinite(policy.freeCancelHours) || policy.freeCancelHours < 0) {
    throw new AttendanceError('freeCancelHours must be >= 0');
  }
  if (
    !Number.isFinite(policy.lateCancelFeePercent) ||
    policy.lateCancelFeePercent < 0 ||
    policy.lateCancelFeePercent > 100
  ) {
    throw new AttendanceError('lateCancelFeePercent must be between 0 and 100');
  }
  if (!Number.isInteger(policy.highRiskThreshold.count) || policy.highRiskThreshold.count < 1) {
    throw new AttendanceError('highRiskThreshold.count must be a positive integer');
  }
  if (!Number.isInteger(policy.highRiskThreshold.days) || policy.highRiskThreshold.days < 1) {
    throw new AttendanceError('highRiskThreshold.days must be a positive integer');
  }

  return policy;
}

function parseReason(input: {
  code: string;
  note?: string | null;
  allowed: readonly string[];
  label: string;
}): Reason {
  const code = input.code.trim().toUpperCase();
  if (!code) throw new AttendanceError(`${input.label} reason is required`);
  if (!input.allowed.includes(code)) {
    throw new AttendanceError(`Unknown ${input.label} reason: ${input.code}`);
  }
  const note = (input.note ?? '').trim();
  if (note.length > 200) throw new AttendanceError('Reason note must be ≤ 200 characters');
  if (code === 'OTHER' && !note) {
    throw new AttendanceError('Reason OTHER requires a free-text note');
  }
  return { code, note: note.length > 0 ? note : null };
}

export function parseCancellationReason(input: { code: string; note?: string | null }): Reason {
  return parseReason({
    ...input,
    allowed: CANCELLATION_REASON_CODES,
    label: 'cancellation',
  });
}

export function parseNoShowReason(input: { code: string; note?: string | null }): Reason {
  return parseReason({ ...input, allowed: NO_SHOW_REASON_CODES, label: 'no-show' });
}

export interface CancellationDecision {
  free: boolean;
  hoursBefore: number;
  feePercent: number;
  salonSide: boolean;
}

export function decideCancellation(input: {
  policy: NoShowPolicy;
  reason: Reason;
  appointmentStart: Date;
  cancelledAt: Date;
}): CancellationDecision {
  const hoursBefore =
    (input.appointmentStart.getTime() - input.cancelledAt.getTime()) / (60 * 60 * 1000);
  const salonSide = SALON_SIDE_REASONS.includes(input.reason.code as CancellationReasonCode);

  if (salonSide) {
    return { free: true, hoursBefore, feePercent: 0, salonSide };
  }
  if (hoursBefore >= input.policy.freeCancelHours) {
    return { free: true, hoursBefore, feePercent: 0, salonSide };
  }
  return {
    free: false,
    hoursBefore,
    feePercent: input.policy.lateCancelFeePercent,
    salonSide,
  };
}

export interface AttendanceRecord {
  id: string;
  appointmentId: string;
  type: AttendanceType;
  clientId: string;
  barberId: string;
  locationId: string;
  serviceId: string | null;
  channel: string | null;
  reason: Reason | null;
  actorRole: CancellationActorRole | null;
  appointmentStart: Date;
  recordedAt: Date;
  recordedBy: string;
  freeCancellation: boolean | null;
  feePercent: number;
  feeWaived: boolean;
  excused: boolean;
  excusedBy: string | null;
  excusedAt: Date | null;
  excusedReason: string | null;
}

export interface RecordCancellationInput {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId: string;
  locationId: string;
  serviceId?: string | null;
  channel?: string | null;
  reason: { code: string; note?: string | null };
  actorRole: CancellationActorRole;
  appointmentStart: Date;
  at: Date;
  by: string;
  policy: NoShowPolicy;
}

export function recordCancellation(input: RecordCancellationInput): AttendanceRecord {
  const reason = parseCancellationReason(input.reason);
  const by = input.by.trim();
  if (!by) throw new AttendanceError('Cancellation author is required');
  if (!input.appointmentId.trim()) throw new AttendanceError('appointmentId is required');
  if (!input.clientId.trim()) throw new AttendanceError('clientId is required');

  const decision = decideCancellation({
    policy: input.policy,
    reason,
    appointmentStart: input.appointmentStart,
    cancelledAt: input.at,
  });

  return {
    id: input.id,
    appointmentId: input.appointmentId,
    type: 'cancellation',
    clientId: input.clientId,
    barberId: input.barberId,
    locationId: input.locationId,
    serviceId: input.serviceId ?? null,
    channel: input.channel ?? null,
    reason,
    actorRole: input.actorRole,
    appointmentStart: input.appointmentStart,
    recordedAt: input.at,
    recordedBy: by,
    freeCancellation: decision.free,
    feePercent: decision.feePercent,
    feeWaived: false,
    excused: false,
    excusedBy: null,
    excusedAt: null,
    excusedReason: null,
  };
}

export interface RecordNoShowInput {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId: string;
  locationId: string;
  serviceId?: string | null;
  channel?: string | null;
  reason?: { code: string; note?: string | null } | null;
  actorRole?: CancellationActorRole | null;
  appointmentStart: Date;
  at: Date;
  by: string;
}

export function recordNoShow(input: RecordNoShowInput): AttendanceRecord {
  const by = input.by.trim();
  if (!by) throw new AttendanceError('No-show author is required');
  if (!input.appointmentId.trim()) throw new AttendanceError('appointmentId is required');
  if (!input.clientId.trim()) throw new AttendanceError('clientId is required');
  const reason = input.reason ? parseNoShowReason(input.reason) : null;

  return {
    id: input.id,
    appointmentId: input.appointmentId,
    type: 'no_show',
    clientId: input.clientId,
    barberId: input.barberId,
    locationId: input.locationId,
    serviceId: input.serviceId ?? null,
    channel: input.channel ?? null,
    reason,
    actorRole: input.actorRole ?? null,
    appointmentStart: input.appointmentStart,
    recordedAt: input.at,
    recordedBy: by,
    freeCancellation: null,
    feePercent: 0,
    feeWaived: false,
    excused: false,
    excusedBy: null,
    excusedAt: null,
    excusedReason: null,
  };
}

/** «Excused no-show» не штрафує клієнта й не входить у статистику. */
export function excuseNoShow(
  record: AttendanceRecord,
  input: { by: string; reason: string; at: Date }
): AttendanceRecord {
  if (record.type !== 'no_show') throw new AttendanceError('Only a no-show can be excused');
  if (record.excused) return record;
  const by = input.by.trim();
  const reason = input.reason.trim();
  if (!by) throw new AttendanceError('Excuse author is required');
  if (!reason) throw new AttendanceError('Excuse reason is required');

  return {
    ...record,
    excused: true,
    excusedBy: by,
    excusedAt: input.at,
    excusedReason: reason,
  };
}

/** Ручне повернення депозиту: утримання знімається, запис лишається в історії. */
export function waiveCancellationFee(
  record: AttendanceRecord,
  input: { by: string; reason: string; at: Date }
): AttendanceRecord {
  if (record.type !== 'cancellation') {
    throw new AttendanceError('Only a cancellation can carry a fee');
  }
  if (record.freeCancellation || record.feeWaived) return record;
  const by = input.by.trim();
  const reason = input.reason.trim();
  if (!by) throw new AttendanceError('Waiver author is required');
  if (!reason) throw new AttendanceError('Waiver reason is required');

  return { ...record, feeWaived: true, feePercent: 0 };
}

export interface HighRiskAssessment {
  clientId: string;
  noShowCount: number;
  windowDays: number;
  threshold: { count: number; days: number };
  requireFullDeposit: boolean;
  blockOnlineBooking: boolean;
  restrictionLifted: boolean;
}

/**
 * Оцінка ризику: рахуються лише невиправдані no-show у вікні політики.
 * `restrictionLifted` знімає блокування, але лічильник лишається видимим.
 */
export function assessHighRisk(input: {
  clientId: string;
  records: AttendanceRecord[];
  policy: NoShowPolicy;
  now: Date;
  restrictionLifted?: boolean;
}): HighRiskAssessment {
  const windowMs = input.policy.highRiskThreshold.days * 24 * 60 * 60 * 1000;
  const from = input.now.getTime() - windowMs;
  const count = input.records.filter(
    (record) =>
      record.clientId === input.clientId &&
      record.type === 'no_show' &&
      !record.excused &&
      record.appointmentStart.getTime() >= from &&
      record.appointmentStart.getTime() <= input.now.getTime()
  ).length;

  const lifted = input.restrictionLifted ?? false;
  const risky = input.policy.depositForHighRisk && count >= input.policy.highRiskThreshold.count;

  return {
    clientId: input.clientId,
    noShowCount: count,
    windowDays: input.policy.highRiskThreshold.days,
    threshold: { ...input.policy.highRiskThreshold },
    requireFullDeposit: risky && !lifted,
    blockOnlineBooking: risky && !lifted,
    restrictionLifted: lifted,
  };
}

export interface DimensionStat {
  key: string;
  noShows: number;
  cancellations: number;
  total: number;
}

export interface NoShowStatsView {
  from: Date;
  to: Date;
  totalAppointments: number;
  noShows: number;
  cancellations: number;
  excusedNoShows: number;
  noShowRate: number | null;
  cancellationRate: number | null;
  byBarber: DimensionStat[];
  byService: DimensionStat[];
  byLocation: DimensionStat[];
  byChannel: DimensionStat[];
  byWeekday: DimensionStat[];
  byHour: DimensionStat[];
  topReasons: Array<{ code: string; count: number }>;
  topCancellationReasons: Array<{ code: string; count: number }>;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** День тижня (Mon..Sun) і година у таймзоні салону — для графіків. */
export function zonedWeekdayHour(
  at: Date,
  timeZone: string = DEFAULT_ATTENDANCE_TIME_ZONE
): { weekday: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(at);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const hour = Number.parseInt(parts.find((part) => part.type === 'hour')?.value ?? '0', 10);
  return { weekday: WEEKDAYS.includes(weekday) ? weekday : 'Mon', hour };
}

function bump(map: Map<string, DimensionStat>, key: string, type: AttendanceType): void {
  const current = map.get(key) ?? { key, noShows: 0, cancellations: 0, total: 0 };
  if (type === 'no_show') current.noShows += 1;
  else current.cancellations += 1;
  current.total += 1;
  map.set(key, current);
}

function sortedStats(map: Map<string, DimensionStat>): DimensionStat[] {
  return [...map.values()].sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}

function topReasons(
  records: AttendanceRecord[],
  type: AttendanceType
): Array<{ code: string; count: number }> {
  const counts = new Map<string, number>();
  for (const record of records) {
    if (record.type !== type || !record.reason) continue;
    counts.set(record.reason.code, (counts.get(record.reason.code) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

function rate(part: number, total: number): number | null {
  if (total <= 0) return null;
  return Number(((part / total) * 100).toFixed(1));
}

/**
 * Агрегати за період. Похідні від записів (скасування + no-show); ставки
 * рахуються від наданої кількості візитів (`totalAppointments`), а не від
 * самих записів — інакше «rate» був би часткою від інцидентів.
 */
export function computeNoShowStats(input: {
  records: AttendanceRecord[];
  from: Date;
  to: Date;
  totalAppointments: number;
  timeZone?: string;
}): NoShowStatsView {
  const timeZone = input.timeZone ?? DEFAULT_ATTENDANCE_TIME_ZONE;
  const records = input.records.filter(
    (record) =>
      record.recordedAt.getTime() >= input.from.getTime() &&
      record.recordedAt.getTime() <= input.to.getTime()
  );

  const byBarber = new Map<string, DimensionStat>();
  const byService = new Map<string, DimensionStat>();
  const byLocation = new Map<string, DimensionStat>();
  const byChannel = new Map<string, DimensionStat>();
  const byWeekday = new Map<string, DimensionStat>();
  const byHour = new Map<string, DimensionStat>();

  let noShows = 0;
  let cancellations = 0;
  let excusedNoShows = 0;

  for (const record of records) {
    if (record.type === 'no_show') {
      noShows += 1;
      if (record.excused) {
        excusedNoShows += 1;
        continue;
      }
    } else {
      cancellations += 1;
    }

    bump(byBarber, record.barberId, record.type);
    bump(byService, record.serviceId ?? 'unknown', record.type);
    bump(byLocation, record.locationId, record.type);
    bump(byChannel, record.channel ?? 'unknown', record.type);

    const { weekday, hour } = zonedWeekdayHour(record.appointmentStart, timeZone);
    bump(byWeekday, weekday, record.type);
    bump(byHour, String(hour).padStart(2, '0'), record.type);
  }

  const totalAppointments = Math.max(0, Math.trunc(input.totalAppointments));

  return {
    from: input.from,
    to: input.to,
    totalAppointments,
    noShows,
    cancellations,
    excusedNoShows,
    noShowRate: rate(noShows - excusedNoShows, totalAppointments),
    cancellationRate: rate(cancellations, totalAppointments),
    byBarber: sortedStats(byBarber),
    byService: sortedStats(byService),
    byLocation: sortedStats(byLocation),
    byChannel: sortedStats(byChannel),
    byWeekday: WEEKDAYS.filter((day) => byWeekday.has(day)).map(
      (day) => byWeekday.get(day) as DimensionStat
    ),
    byHour: sortedStats(byHour).sort((a, b) => a.key.localeCompare(b.key)),
    topReasons: topReasons(records, 'no_show'),
    topCancellationReasons: topReasons(records, 'cancellation'),
  };
}

export interface ClientAttendanceHistory {
  clientId: string;
  totalNoShows: number;
  excusedNoShows: number;
  cancellations: number;
  recentNoShows: AttendanceRecord[];
  trend: 'improving' | 'worsening' | 'stable';
  counts: {
    last30Days: number;
    previous30Days: number;
  };
}

/** Історія клієнта: лічильники, останні випадки й тренд за 30 днів. */
export function clientAttendanceHistory(
  records: AttendanceRecord[],
  clientId: string,
  now: Date
): ClientAttendanceHistory {
  const own = records.filter((record) => record.clientId === clientId);
  const noShowRecords = own.filter((record) => record.type === 'no_show');
  const recentWindow = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const previousWindow = now.getTime() - 60 * 24 * 60 * 60 * 1000;

  const last30Days = noShowRecords.filter(
    (record) =>
      record.appointmentStart.getTime() >= recentWindow &&
      record.appointmentStart.getTime() <= now.getTime()
  ).length;
  const previous30Days = noShowRecords.filter(
    (record) =>
      record.appointmentStart.getTime() >= previousWindow &&
      record.appointmentStart.getTime() < recentWindow
  ).length;

  const trend =
    last30Days < previous30Days
      ? 'improving'
      : last30Days > previous30Days
        ? 'worsening'
        : 'stable';

  return {
    clientId,
    totalNoShows: noShowRecords.filter((record) => !record.excused).length,
    excusedNoShows: noShowRecords.filter((record) => record.excused).length,
    cancellations: own.filter((record) => record.type === 'cancellation').length,
    recentNoShows: [...noShowRecords]
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, 5),
    trend,
    counts: { last30Days, previous30Days },
  };
}
