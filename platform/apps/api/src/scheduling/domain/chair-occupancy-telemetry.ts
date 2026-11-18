// Chair occupancy telemetry (T-4622): стан крісла в реальному часі та
// виявлення overrun. Домен чистий — без Nest/Prisma/HTTP; адмінка будує з
// цього знімка live-індикатори завантаженості й попередження про overrun.

export type ChairState = 'idle' | 'prep' | 'cutting' | 'sanitizing' | 'overrun';

export interface ChairSlot {
  chairId: string;
  state: ChairState;
  /** Початок поточного візиту (мс); немає — крісло вільне. */
  startedAtMs?: number;
  /** Планова тривалість візиту (хв). */
  plannedMinutes?: number;
}

export interface ChairOccupancySnapshot {
  chairId: string;
  state: ChairState;
  /** Частка плану, вже витрачена візитом [0,1+]. */
  utilization: number;
  /** Перевищення плану (хв), ≥ 0. */
  overrunMinutes: number;
  isOverrun: boolean;
}

export interface OccupancyTelemetryInput {
  chairs: ChairSlot[];
  nowMs: number;
  /** Допуск понад планову тривалість (хв) до сигналу overrun. */
  overrunGraceMinutes?: number;
}

export const DEFAULT_OVERRUN_GRACE_MINUTES = 10;

/** Активний візит: задані початок і додатна планова тривалість. */
interface ActiveVisit {
  startedAtMs: number;
  plannedMinutes: number;
}

function activeVisit(chair: ChairSlot): ActiveVisit | null {
  const { startedAtMs, plannedMinutes } = chair;
  if (chair.state === 'idle' || startedAtMs === undefined) return null;
  if (plannedMinutes === undefined || plannedMinutes <= 0) return null;
  return { startedAtMs, plannedMinutes };
}

function elapsedMinutes(visit: ActiveVisit, nowMs: number): number {
  return Math.max(0, (nowMs - visit.startedAtMs) / 60000);
}

/** Стан крісла з урахуванням часу: активний візит понад план → `overrun`. */
export function resolveChairState(
  chair: ChairSlot,
  nowMs: number,
  graceMinutes: number
): ChairState {
  const visit = activeVisit(chair);
  if (!visit) return chair.state;
  const overrun = elapsedMinutes(visit, nowMs) - visit.plannedMinutes;
  return overrun > graceMinutes ? 'overrun' : chair.state;
}

/** Знімок завантаженості крісел для живого потоку адмінки. */
export function buildOccupancySnapshot(input: OccupancyTelemetryInput): ChairOccupancySnapshot[] {
  const grace = input.overrunGraceMinutes ?? DEFAULT_OVERRUN_GRACE_MINUTES;
  return input.chairs.map((chair) => {
    const state = resolveChairState(chair, input.nowMs, grace);
    const visit = activeVisit(chair);
    if (!visit) {
      return { chairId: chair.chairId, state, utilization: 0, overrunMinutes: 0, isOverrun: false };
    }
    const elapsed = elapsedMinutes(visit, input.nowMs);
    return {
      chairId: chair.chairId,
      state,
      utilization: Number((elapsed / visit.plannedMinutes).toFixed(4)),
      overrunMinutes: Math.max(0, Math.round(elapsed - visit.plannedMinutes)),
      isOverrun: state === 'overrun',
    };
  });
}

/** Частка крісел у стані overrun [0,1] — метрика SLO текучості (T-4622). */
export function overrunRate(snapshots: ChairOccupancySnapshot[]): number {
  if (snapshots.length === 0) return 0;
  const overrun = snapshots.filter((s) => s.isOverrun).length;
  return Number((overrun / snapshots.length).toFixed(4));
}
