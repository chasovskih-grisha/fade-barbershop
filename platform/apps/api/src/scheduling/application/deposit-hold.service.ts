/* eslint-disable max-lines -- cohesive module (131 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// T-4619a: утримання крісла під незаплачений депозит.
// T-4619a: утримання крісла під незаплачений депозит.
//
// Порт `DepositHoldRepository` не залежить від сховища: у проді — Prisma,
// у тестах — in-memory. Сервіс відкриває утримання на 15 хвилин, підтверджує
// оплату в межах вікна, скасовує його разом зі скасуванням візиту й звільняє
// прострочені крісла (sweeper), повідомляючи підписників подією.
import { Inject, Injectable, Optional } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import {
  cancelHold,
  captureHold,
  expireHold,
  holdBlocksChair,
  isHoldExpired,
  openDepositHold,
  type DepositHold,
} from '../domain/deposit-hold';

export const DEPOSIT_HOLD_REPOSITORY = 'DEPOSIT_HOLD_REPOSITORY';
export const DEPOSIT_HOLD_PUBLISHER = 'DEPOSIT_HOLD_PUBLISHER';
export const DEPOSIT_HOLD_EXPIRY_SINK = 'DEPOSIT_HOLD_EXPIRY_SINK';

export interface DepositHoldRepository {
  findByAppointmentId(appointmentId: string): Promise<DepositHold | null>;
  save(hold: DepositHold): Promise<void>;
  /** Утримання в заданому статусі; sweeper бере `active`. */
  listByStatus(status: DepositHold['status']): Promise<DepositHold[]>;
}

export interface DepositHoldEvent {
  type: 'deposit_hold.expired' | 'deposit_hold.captured';
  appointmentId: string;
  barberId: string;
  locationId: string;
  at: Date;
}

/**
 * T-4619a: персистентний ефект прострочення — візит стає `cancelled` з
 * причиною `deposit_expired`, а в outbox пишеться рівно одна подія.
 * Адаптер мусить бути ідемпотентним: повторний sweep не дублює подію.
 */
export interface DepositHoldExpirySink {
  expire(input: {
    appointmentId: string;
    barberId: string;
    locationId: string;
    at: Date;
  }): Promise<void>;
}

export class InMemoryDepositHoldRepository implements DepositHoldRepository {
  private readonly holds = new Map<string, DepositHold>();

  async findByAppointmentId(appointmentId: string): Promise<DepositHold | null> {
    return this.holds.get(appointmentId) ?? null;
  }

  async save(hold: DepositHold): Promise<void> {
    this.holds.set(hold.appointmentId, hold);
  }

  async listByStatus(status: DepositHold['status']): Promise<DepositHold[]> {
    return [...this.holds.values()].filter((hold) => hold.status === status);
  }
}

export interface OpenHoldInput {
  appointmentId: string;
  barberId: string;
  locationId: string;
  startAt: Date;
  endAt: Date;
  depositAmount: number;
  windowMinutes?: number;
}

@Injectable()
export class DepositHoldService {
  // Порт — інтерфейс: Nest резолвить його лише через явний токен.
  constructor(
    @Inject(DEPOSIT_HOLD_REPOSITORY)
    private readonly repository: DepositHoldRepository,
    @Optional()
    @Inject(DEPOSIT_HOLD_PUBLISHER)
    private readonly publish: (event: DepositHoldEvent) => Promise<void> | void = () => undefined,
    @Optional()
    @Inject(DEPOSIT_HOLD_EXPIRY_SINK)
    private readonly expirySink?: DepositHoldExpirySink
  ) {}

  /**
   * Відкрити утримання. Повторний виклик для того ж візиту не створює нового
   * вікна: існуюче утримання повертається як є (ідемпотентність ретраїв),
   * включно з термінальним — хоч раз скасоване/прострочене не відроджується.
   */
  async open(input: OpenHoldInput, now: Date = new Date()): Promise<DepositHold> {
    const existing = await this.repository.findByAppointmentId(input.appointmentId);
    if (existing) return existing;
    const hold = openDepositHold({ ...input, id: uuidv7(), now });
    await this.repository.save(hold);
    return hold;
  }

  /** Оплата в межах вікна підтверджує крісло; після — повертає `expired`. */
  async capture(
    appointmentId: string,
    now: Date = new Date()
  ): Promise<{ outcome: 'captured' | 'already_captured' | 'expired' | 'cancelled' | 'missing' }> {
    const hold = await this.repository.findByAppointmentId(appointmentId);
    if (!hold) return { outcome: 'missing' };
    const result = captureHold(hold, now);
    if (result.outcome === 'captured' && result.hold !== hold) {
      await this.repository.save(result.hold);
    }
    if (result.outcome === 'captured') {
      await this.publish({
        type: 'deposit_hold.captured',
        appointmentId,
        barberId: hold.barberId,
        locationId: hold.locationId,
        at: now,
      });
    }
    if (result.outcome === 'expired' && hold.status === 'active') {
      await this.expireAndNotify(result.hold, now);
    }
    return { outcome: result.outcome };
  }

  /**
   * Перевірка перед списанням: прострочене утримання одразу переводиться в
   * `expired` (з подією), активне лишається активним — його закриє capture
   * після успішної оплати.
   */
  async status(
    appointmentId: string,
    now: Date = new Date()
  ): Promise<'active' | 'captured' | 'expired' | 'cancelled' | 'missing'> {
    const hold = await this.repository.findByAppointmentId(appointmentId);
    if (!hold) return 'missing';
    if (hold.status === 'active' && isHoldExpired(hold, now)) {
      await this.expireAndNotify({ ...hold, status: 'expired', updatedAt: now }, now);
      return 'expired';
    }
    return hold.status;
  }

  /** Скасування візиту до оплати звільняє крісло негайно. */
  async release(appointmentId: string, now: Date = new Date()): Promise<boolean> {
    const hold = await this.repository.findByAppointmentId(appointmentId);
    if (!hold) return false;
    const cancelled = cancelHold(hold, now);
    if (!cancelled) return false;
    await this.repository.save(cancelled);
    return true;
  }

  /**
   * Sweeper: прострочені утримання переходять у `expired` і звільняють крісло.
   * Повторний прохід нічого не змінює (немає подвійних подій).
   */
  async sweep(now: Date = new Date()): Promise<DepositHold[]> {
    const active = await this.repository.listByStatus('active');
    const expired: DepositHold[] = [];
    for (const hold of active) {
      const next = expireHold(hold, now);
      if (!next) continue;
      await this.expireAndNotify(next, now);
      expired.push(next);
    }
    return expired;
  }

  /** Крісла, які зараз тримає активне (не прострочене) утримання. */
  async blockingAppointmentIds(now: Date = new Date()): Promise<Set<string>> {
    const active = await this.repository.listByStatus('active');
    return new Set(active.filter((hold) => holdBlocksChair(hold, now)).map((h) => h.appointmentId));
  }

  /**
   * Візити, чиї утримання вже не діють (прострочені або скасовані): публічні
   * слоти не блокуються ними, навіть якщо sweeper ще не пройшов.
   */
  async releasedAppointmentIds(now: Date = new Date()): Promise<Set<string>> {
    const [active, expired, cancelled] = await Promise.all([
      this.repository.listByStatus('active'),
      this.repository.listByStatus('expired'),
      this.repository.listByStatus('cancelled'),
    ]);
    const released = new Set<string>(expired.map((h) => h.appointmentId));
    for (const hold of cancelled) released.add(hold.appointmentId);
    for (const hold of active) {
      if (isHoldExpired(hold, now)) released.add(hold.appointmentId);
    }
    return released;
  }

  /**
   * Один ефект прострочення: спершу durable-візит + outbox, потім утримання.
   * Якщо процес упаде між кроками, наступний sweep повторить sink, а його
   * умовний UPDATE не дасть другій події.
   */
  private async expireAndNotify(hold: DepositHold, now: Date): Promise<void> {
    await this.expirySink?.expire({
      appointmentId: hold.appointmentId,
      barberId: hold.barberId,
      locationId: hold.locationId,
      at: now,
    });
    await this.repository.save(hold);
    await this.publish({
      type: 'deposit_hold.expired',
      appointmentId: hold.appointmentId,
      barberId: hold.barberId,
      locationId: hold.locationId,
      at: now,
    });
  }
}
