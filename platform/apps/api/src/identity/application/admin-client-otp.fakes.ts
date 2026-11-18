// Fakes спеки admin-client-otp (окремий файл — max-lines і coverage гейти):
// класи-фейки в пам'яті, їх юзають і e2e-харнеси. Збірка середовища —
// в admin-client-otp.fakes.env.ts.
import { OtpChallenge } from '../domain/otp-challenge';
import { User } from '../domain/user';
import type { DomainEvent } from '../domain/events';
import type { OtpChallengeRepository, OtpSender, Outbox, UserRepository } from '../domain/ports';
import type { ClientProfilesPort } from './admin-onboard-client';

export const NOW = new Date('2026-09-27T10:00:00.000Z');

export class MemChallenges implements OtpChallengeRepository {
  store = new Map<string, OtpChallenge>();
  async findLastByPhone(phone: string) {
    return (
      [...this.store.values()]
        .filter((c) => c.phone === phone)
        .sort((a, b) => +b.createdAt - +a.createdAt)[0] ?? null
    );
  }
  async save(c: OtpChallenge) {
    this.store.set(c.id, c);
  }
}

export class MemUsers implements UserRepository {
  store = new Map<string, User>();
  async findById(id: string) {
    return this.store.get(id) ?? null;
  }
  async findByPhone(phone: string) {
    return [...this.store.values()].find((u) => u.phone.value === phone) ?? null;
  }
  async findByUsername() {
    return null;
  }
  async findByEmail() {
    return null;
  }
  async listByRole() {
    return [];
  }
  async save(u: User) {
    this.store.set(u.id, u);
  }
}

export class CapturingSender implements OtpSender {
  sent: { phone: string; digits: string; purpose?: string | undefined }[] = [];
  async send(phone: string, digits: string, purpose?: 'login' | 'booking') {
    this.sent.push({ phone, digits, purpose });
  }
}

export class MemOutbox implements Outbox {
  events: DomainEvent[] = [];
  async append(events: readonly DomainEvent[]) {
    this.events.push(...events);
  }
}

/** Порт crm-профілів (T-046): фіксує створені картки для перевірок спеки. */
export class MemClientProfiles implements ClientProfilesPort {
  created: { userId: string; phone: string; name: string | null }[] = [];
  async createForUser(input: {
    userId: string;
    phone: string;
    name: string | null;
  }): Promise<void> {
    this.created.push(input);
  }
}
