// Фейки портів для функціональних тестів use cases (engineering-principles.md:
// "не мокати те, що має фейк порту"). Працюють у пам'яті, без БД.

import type {
  Clock,
  IdGenerator,
  OtpChallengeRepository,
  OtpSender,
  Outbox,
  UnitOfWork,
  UserRepository,
} from '../domain/ports';
import type { DomainEvent } from '../domain/events';
import type { Role } from '../domain/role';
import { uuidv7 } from '@fade/domain-shared';
import { OtpChallenge } from '../domain/otp-challenge';
import { User } from '../domain/user';

export { FakeSessionRepository } from './ports.session.fakes';

export class FakeClock implements Clock {
  private current: number;
  constructor(iso: string) {
    this.current = new Date(iso).getTime();
  }
  now(): Date {
    return new Date(this.current);
  }
  advance(ms: number): void {
    this.current += ms;
  }
}

/** IdGenerator на UUID v7 (T-4300e): тести не залежать від порядку вставки. */
export class UuidIds implements IdGenerator {
  id(): string {
    return uuidv7();
  }
}

export class FakeOtpSender implements OtpSender {
  readonly sent: Array<{ phone: string; digits: string; purpose: string }> = [];
  async send(phone: string, digits: string, purpose = 'login'): Promise<void> {
    this.sent.push({ phone, digits, purpose });
  }
}

export class FakeOutbox implements Outbox {
  readonly events: DomainEvent[] = [];
  async append(events: readonly DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }
}

export class FakeOtpChallengeRepository implements OtpChallengeRepository {
  private store = new Map<string, OtpChallenge>();
  async findLastByPhone(phone: string): Promise<OtpChallenge | null> {
    const last = [...this.store.values()]
      .filter((c) => c.phone === phone)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    return last ?? null;
  }
  async save(challenge: OtpChallenge): Promise<void> {
    this.store.set(challenge.id, challenge);
  }
  get(id: string): OtpChallenge | undefined {
    return this.store.get(id);
  }
}

export class FakeUserRepository implements UserRepository {
  private store = new Map<string, User>();
  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }
  async findByPhone(phone: string): Promise<User | null> {
    return [...this.store.values()].find((u) => u.phone.value === phone) ?? null;
  }
  async findByUsername(username: string): Promise<User | null> {
    return [...this.store.values()].find((u) => u.username === username) ?? null;
  }
  /** T-4422: пошук за email сповіщень (унікальність адреси). */
  async findByEmail(email: string): Promise<User | null> {
    return [...this.store.values()].find((u) => u.email === email) ?? null;
  }
  async listByRole(role: Role): Promise<User[]> {
    return [...this.store.values()].filter((u) => u.role === role);
  }
  async save(user: User): Promise<void> {
    this.store.set(user.id, user);
  }
  get all(): User[] {
    return [...this.store.values()];
  }
}

export const passthroughUow: UnitOfWork = {
  run: async <T>(work: () => Promise<T>): Promise<T> => work(),
};
