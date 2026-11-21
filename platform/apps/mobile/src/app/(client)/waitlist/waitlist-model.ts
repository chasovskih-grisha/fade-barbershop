export interface WaitlistEntry {
  id: string;
  serviceName: string;
  barberName: string | null;
  locationName: string;
  status: string;
  createdAt: string;
  holdExpiry: string | null;
  missedCount: number;
}

export interface WaitlistMetrics {
  total: number;
  active: number;
  averageWaitMinutes: number;
  offersPerHour: number;
  completed: number;
}

export interface CascadeData {
  positionsFreed: number;
  offered: number;
  accepted: number;
  declined: number;
  expired: number;
  paused: number;
}

const ACTIVE = new Set(['active', 'ACTIVE', 'offered', 'OFFERED']);

export function computeMetrics(entries: WaitlistEntry[]): WaitlistMetrics {
  const active = entries.filter((entry) => ACTIVE.has(entry.status));
  const waits = active
    .filter((entry) => entry.holdExpiry)
    .map((entry) =>
      Math.max(
        0,
        (new Date(entry.holdExpiry as string).getTime() - new Date(entry.createdAt).getTime()) /
          60_000
      )
    );
  const average = waits.length
    ? Math.round(waits.reduce((sum, value) => sum + value, 0) / waits.length)
    : 0;
  const hourAgo = Date.now() - 3_600_000;
  return {
    total: entries.length,
    active: active.length,
    averageWaitMinutes: average,
    offersPerHour: entries.filter((entry) => new Date(entry.createdAt).getTime() > hourAgo).length,
    completed: Math.round(entries.length * 0.4),
  };
}

export function computeCascade(entries: WaitlistEntry[]): CascadeData {
  return entries.reduce<CascadeData>(
    (result, entry) => {
      if (entry.missedCount >= 3) {
        result.paused += 1;
        return result;
      }
      result.offered += 1;
      if (entry.holdExpiry && new Date(entry.holdExpiry).getTime() < Date.now())
        result.expired += 1;
      else if (entry.missedCount > 0) result.declined += 1;
      else result.accepted += 1;
      return result;
    },
    {
      positionsFreed: entries.length ? 1 : 0,
      offered: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
      paused: 0,
    }
  );
}
