// T-4616a: позначити недоступність барбера. Маркування лише створює факти
// недоступності й відкриті конфлікти для майбутніх візитів — жоден візит не
// скасовується, не переноситься і не змінює статус.
import { uuidv7 } from '@fade/domain-shared';
import {
  assertAvailabilityInterval,
  isActionableVisit,
  openPartyConflict,
  type BarberUnavailabilityData,
  type VisitRow,
} from '../domain/barber-unavailability';
import type {
  BarberUnavailabilityRepository,
  ShiftConflictRepository,
} from '../domain/shift-conflict-ports';

export interface MarkBarberUnavailableDeps {
  unavailabilities: BarberUnavailabilityRepository;
  conflicts: ShiftConflictRepository;
  clock: { now(): Date };
}

export interface MarkBarberUnavailableCommand {
  id?: string;
  barberId: string;
  /** Без локації — недоступність у всіх локаціях барбера. */
  locationId?: string;
  /** ISO-8601; інтервал задає виклик (локальна доба локації — його відповідальність). */
  start: string;
  end: string;
  reason?: string;
  actorId: string;
}

export interface MarkBarberUnavailableResult {
  unavailability: BarberUnavailabilityData;
  conflictsCreated: number;
}

export class MarkBarberUnavailable {
  constructor(private readonly deps: MarkBarberUnavailableDeps) {}

  async execute(cmd: MarkBarberUnavailableCommand): Promise<MarkBarberUnavailableResult> {
    if (!cmd.barberId.trim()) throw new Error('barberId is required');
    const start = new Date(cmd.start);
    const end = new Date(cmd.end);
    assertAvailabilityInterval(start, end);

    const now = this.deps.clock.now();
    const unavailability: BarberUnavailabilityData = {
      id: cmd.id ?? uuidv7(),
      barberId: cmd.barberId,
      locationId: cmd.locationId ?? null,
      start,
      end,
      ...(cmd.reason ? { reason: cmd.reason } : {}),
      createdBy: cmd.actorId,
      createdAt: now,
    };
    await this.deps.unavailabilities.save(unavailability);

    const visits = await this.deps.unavailabilities.futureVisitsForBarber({
      barberId: cmd.barberId,
      interval: { start, end },
      now,
      ...(cmd.locationId ? { locationId: cmd.locationId } : {}),
    });
    const groups = groupVisits(visits);
    let conflictsCreated = 0;
    for (const group of groups.values()) {
      const created = await this.deps.conflicts.open(
        openPartyConflict({ id: uuidv7(), visits: group, createdAt: now })
      );
      if (created) conflictsCreated += 1;
    }
    return { unavailability, conflictsCreated };
  }
}

/** Партія — одна група; соло-візит — окрема. Завершені/скасовані не входять. */
function groupVisits(visits: VisitRow[]): VisitRow[][] {
  const groups = new Map<string, VisitRow[]>();
  for (const visit of visits) {
    if (!isActionableVisit(visit.status)) continue;
    const key = visit.partyId ? `party:${visit.partyId}` : `booking:${visit.bookingId}`;
    const group = groups.get(key) ?? [];
    group.push(visit);
    groups.set(key, group);
  }
  return [...groups.values()];
}
