/* eslint-disable max-lines, max-params -- cohesive module (375 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 2 signatures whose 5-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
/**
 * T-4560: сервіс керування no-show і скасуваннями.
 *
 * Доменні правила — у domain/attendance-management.ts. Тут порти (записи,
 * політики, обсяг візитів, події, годинник) і послідовність:
 * причина → політика локації/послуги → рішення про депозит → запис →
 * подія → оцінка ризику клієнта.
 *
 * Персистенція in-memory: у `prisma/schema.prisma` немає таблиць причин і
 * політик; порти готові до Prisma-адаптера. Обсяг візитів для ставок
 * приходить із read-моделі (`ATTENDANCE_VOLUME`).
 */
import { Inject, Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import {
  AttendanceError,
  assessHighRisk,
  clientAttendanceHistory,
  computeNoShowStats,
  excuseNoShow,
  normalizeNoShowPolicy,
  recordCancellation as buildCancellationRecord,
  recordNoShow as buildNoShowRecord,
  waiveCancellationFee,
  type AttendanceRecord,
  type CancellationActorRole,
  type ClientAttendanceHistory,
  type HighRiskAssessment,
  type NoShowPolicy,
  type NoShowStatsView,
} from '../domain/attendance-management';

export { AttendanceError } from '../domain/attendance-management';
export type { AttendanceRecord, NoShowPolicy } from '../domain/attendance-management';

export const ATTENDANCE_REPOSITORY = 'ATTENDANCE_REPOSITORY';
export const ATTENDANCE_POLICIES = 'ATTENDANCE_POLICIES';
export const ATTENDANCE_VOLUME = 'ATTENDANCE_VOLUME';
export const ATTENDANCE_EVENTS = 'ATTENDANCE_EVENTS';
export const ATTENDANCE_CLOCK = 'ATTENDANCE_CLOCK';

export interface AttendanceClock {
  now(): Date;
}

export interface AttendanceRepository {
  findById(id: string): Promise<AttendanceRecord | null>;
  save(record: AttendanceRecord): Promise<void>;
  list(): Promise<AttendanceRecord[]>;
}

export class InMemoryAttendanceRepository implements AttendanceRepository {
  private readonly records = new Map<string, AttendanceRecord>();

  async findById(id: string): Promise<AttendanceRecord | null> {
    return this.records.get(id) ?? null;
  }

  async save(record: AttendanceRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async list(): Promise<AttendanceRecord[]> {
    return [...this.records.values()];
  }
}

export interface NoShowPolicyRepository {
  get(input: { locationId: string; serviceId?: string | null }): Promise<NoShowPolicy>;
  set(policy: NoShowPolicy): Promise<void>;
  list(): Promise<NoShowPolicy[]>;
}

export class InMemoryNoShowPolicyRepository implements NoShowPolicyRepository {
  private readonly policies = new Map<string, NoShowPolicy>();

  constructor(seed: Array<NoShowPolicy | Partial<NoShowPolicy>> = []) {
    for (const policy of seed) this.setSync(normalizeNoShowPolicy(policy));
  }

  private key(locationId: string, serviceId: string | null): string {
    return `${locationId}::${serviceId ?? '*'}`;
  }

  private setSync(policy: NoShowPolicy): void {
    this.policies.set(this.key(policy.locationId, policy.serviceId), {
      ...policy,
      highRiskThreshold: { ...policy.highRiskThreshold },
    });
  }

  async get(input: { locationId: string; serviceId?: string | null }): Promise<NoShowPolicy> {
    return (
      this.policies.get(this.key(input.locationId, input.serviceId ?? null)) ??
      this.policies.get(this.key(input.locationId, null)) ??
      this.policies.get(this.key('*', null)) ??
      normalizeNoShowPolicy()
    );
  }

  async set(policy: NoShowPolicy): Promise<void> {
    this.setSync(policy);
  }

  async list(): Promise<NoShowPolicy[]> {
    return [...this.policies.values()];
  }
}

/** Кількість візитів за період — знаменник для ставок. */
export interface AppointmentVolumeSource {
  total(input: { from: Date; to: Date }): Promise<number>;
}

export class InMemoryAppointmentVolume implements AppointmentVolumeSource {
  private value = 0;

  constructor(initial = 0) {
    this.value = initial;
  }

  setTotal(total: number): void {
    this.value = total;
  }

  async total(): Promise<number> {
    return this.value;
  }
}

export interface AttendanceEvents {
  append(event: { type: string; payload: Record<string, unknown> }): Promise<void>;
}

export interface AttendanceEventSink extends AttendanceEvents {
  list(): Array<{ type: string; payload: Record<string, unknown> }>;
}

export class RecordingAttendanceEvents implements AttendanceEventSink {
  private readonly events: Array<{ type: string; payload: Record<string, unknown> }> = [];

  async append(event: { type: string; payload: Record<string, unknown> }): Promise<void> {
    this.events.push(event);
  }

  list(): Array<{ type: string; payload: Record<string, unknown> }> {
    return [...this.events];
  }
}

export interface RestrictionOverride {
  clientId: string;
  lifted: boolean;
  by: string;
  note: string;
  at: Date;
}

@Injectable()
export class AttendanceManagementService {
  private readonly restrictions = new Map<string, RestrictionOverride>();

  constructor(
    @Inject(ATTENDANCE_REPOSITORY)
    private readonly repository: AttendanceRepository,
    @Inject(ATTENDANCE_POLICIES)
    private readonly policies: NoShowPolicyRepository,
    @Inject(ATTENDANCE_VOLUME)
    private readonly volume: AppointmentVolumeSource,
    @Inject(ATTENDANCE_EVENTS)
    private readonly events: AttendanceEvents,
    @Inject(ATTENDANCE_CLOCK)
    private readonly clock: AttendanceClock
  ) {}

  async recordCancellation(input: {
    appointmentId: string;
    clientId: string;
    barberId: string;
    locationId: string;
    serviceId?: string | null;
    channel?: string | null;
    reason: { code: string; note?: string | null };
    actorRole: CancellationActorRole;
    appointmentStart: Date;
    by: string;
    at?: Date;
    /** Явна політика (адмінський оверрайд); без неї — політика локації/послуги. */
    policy?: NoShowPolicy;
  }): Promise<AttendanceRecord> {
    const policy =
      input.policy ??
      (await this.policies.get({
        locationId: input.locationId,
        serviceId: input.serviceId ?? null,
      }));
    const record = buildCancellationRecord({
      ...input,
      id: uuidv7(),
      at: input.at ?? this.clock.now(),
      policy,
    });

    await this.repository.save(record);
    await this.events.append({
      type: 'appointment.cancelled',
      payload: {
        recordId: record.id,
        appointmentId: record.appointmentId,
        clientId: record.clientId,
        reason: record.reason?.code ?? null,
        freeCancellation: record.freeCancellation,
        feePercent: record.feePercent,
        occurredAt: record.recordedAt,
      },
    });
    return record;
  }

  async recordNoShow(input: {
    appointmentId: string;
    clientId: string;
    barberId: string;
    locationId: string;
    serviceId?: string | null;
    channel?: string | null;
    reason?: { code: string; note?: string | null } | null;
    actorRole?: CancellationActorRole | null;
    appointmentStart: Date;
    by: string;
    at?: Date;
  }): Promise<AttendanceRecord> {
    const record = buildNoShowRecord({
      ...input,
      id: uuidv7(),
      at: input.at ?? this.clock.now(),
    });

    await this.repository.save(record);
    await this.events.append({
      type: 'appointment.no_show',
      payload: {
        recordId: record.id,
        appointmentId: record.appointmentId,
        clientId: record.clientId,
        reason: record.reason?.code ?? null,
        occurredAt: record.recordedAt,
      },
    });

    const risk = await this.assessRisk(record.clientId, record.locationId, record.recordedAt);
    if (risk.requireFullDeposit) {
      await this.events.append({
        type: 'client.high_risk',
        payload: {
          clientId: record.clientId,
          noShowCount: risk.noShowCount,
          threshold: risk.threshold,
          requireFullDeposit: risk.requireFullDeposit,
          blockOnlineBooking: risk.blockOnlineBooking,
        },
      });
    }
    return record;
  }

  /** Записи для адмінки: фільтр за локацією/клієнтом, найновіші першими. */
  async listRecords(
    filter: { locationId?: string; clientId?: string } = {}
  ): Promise<AttendanceRecord[]> {
    const records = await this.repository.list();
    return records
      .filter(
        (record) =>
          (filter.locationId === undefined || record.locationId === filter.locationId) &&
          (filter.clientId === undefined || record.clientId === filter.clientId)
      )
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  }

  /** Статистика клієнта за період (типово — останні 30 днів). */
  async statsForClient(
    clientId: string,
    input: { from?: Date; to?: Date } = {}
  ): Promise<NoShowStatsView> {
    const to = input.to ?? this.clock.now();
    const from = input.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [records, totalAppointments] = await Promise.all([
      this.repository.list(),
      this.volume.total({ from, to }),
    ]);
    return computeNoShowStats({
      records: records.filter((record) => record.clientId === clientId),
      from,
      to,
      totalAppointments,
    });
  }

  /** Поточне рішення адміна щодо блокування онлайн-запису клієнта. */
  async getRestriction(clientId: string): Promise<RestrictionOverride | null> {
    return this.restrictions.get(clientId.trim()) ?? null;
  }

  async stats(input: { from: Date; to: Date }): Promise<NoShowStatsView> {
    if (Number.isNaN(input.from.getTime()) || Number.isNaN(input.to.getTime())) {
      throw new AttendanceError('Invalid stats period');
    }
    if (input.from.getTime() > input.to.getTime()) {
      throw new AttendanceError('Stats period start must be before its end');
    }
    const [records, totalAppointments] = await Promise.all([
      this.repository.list(),
      this.volume.total(input),
    ]);
    return computeNoShowStats({
      records,
      from: input.from,
      to: input.to,
      totalAppointments,
    });
  }

  async history(clientId: string, now: Date = this.clock.now()): Promise<ClientAttendanceHistory> {
    const id = clientId.trim();
    if (!id) throw new AttendanceError('Client id is required');
    return clientAttendanceHistory(await this.repository.list(), id, now);
  }

  /** Ризик клієнта за політикою локації останнього запису. */
  async risk(clientId: string, now: Date = this.clock.now()): Promise<HighRiskAssessment> {
    const id = clientId.trim();
    if (!id) throw new AttendanceError('Client id is required');
    const records = await this.repository.list();
    const latest = records
      .filter((record) => record.clientId === id)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];

    return this.assessRisk(id, latest?.locationId ?? '*', now, records);
  }

  async excuse(
    recordId: string,
    input: { by: string; reason: string; at?: Date }
  ): Promise<AttendanceRecord> {
    const record = await this.require(recordId);
    const updated = excuseNoShow(record, {
      by: input.by,
      reason: input.reason,
      at: input.at ?? this.clock.now(),
    });
    await this.repository.save(updated);
    return updated;
  }

  async waiveFee(
    recordId: string,
    input: { by: string; reason: string; at?: Date }
  ): Promise<AttendanceRecord> {
    const record = await this.require(recordId);
    const updated = waiveCancellationFee(record, {
      by: input.by,
      reason: input.reason,
      at: input.at ?? this.clock.now(),
    });
    await this.repository.save(updated);

    if (updated !== record) {
      await this.events.append({
        type: 'billing.deposit_returned',
        payload: {
          recordId: updated.id,
          appointmentId: updated.appointmentId,
          clientId: updated.clientId,
          by: input.by,
          reason: input.reason,
        },
      });
    }
    return updated;
  }

  async setPolicy(input: Partial<NoShowPolicy>): Promise<NoShowPolicy> {
    const policy = normalizeNoShowPolicy(input);
    await this.policies.set(policy);
    return policy;
  }

  async policy(input: { locationId: string; serviceId?: string | null }): Promise<NoShowPolicy> {
    return this.policies.get(input);
  }

  /** Адмін знімає або повертає блокування онлайн-запису. */
  async setRestriction(
    clientId: string,
    input: { lifted: boolean; by: string; note: string; at?: Date }
  ): Promise<RestrictionOverride> {
    const id = clientId.trim();
    if (!id) throw new AttendanceError('Client id is required');
    const by = input.by.trim();
    if (!by) throw new AttendanceError('Restriction author is required');
    const note = input.note.trim();
    if (!note) throw new AttendanceError('Restriction note is required');

    const override: RestrictionOverride = {
      clientId: id,
      lifted: input.lifted,
      by,
      note,
      at: input.at ?? this.clock.now(),
    };
    this.restrictions.set(id, override);
    await this.events.append({
      type: input.lifted
        ? 'client.booking_restriction_lifted'
        : 'client.booking_restriction_restored',
      payload: { clientId: id, by, note },
    });
    return override;
  }

  private async assessRisk(
    clientId: string,
    locationId: string,
    now: Date,
    loaded?: AttendanceRecord[]
  ): Promise<HighRiskAssessment> {
    const records = loaded ?? (await this.repository.list());
    const policy = await this.policies.get({ locationId });
    return assessHighRisk({
      clientId,
      records,
      policy,
      now,
      restrictionLifted: this.restrictions.get(clientId)?.lifted ?? false,
    });
  }

  private async require(id: string): Promise<AttendanceRecord> {
    const record = await this.repository.findById(id);
    if (!record) throw new AttendanceError(`Attendance record ${id} not found`);
    return record;
  }
}
