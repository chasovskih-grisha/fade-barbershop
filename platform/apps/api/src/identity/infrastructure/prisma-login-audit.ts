// PrismaLoginAudit (T-4411) — журнал входів адміна на AppSetting (MNG-ADM-18:
// ключ → JSON). Ключ `admin.login_audit:<userId>`, value — останні ≤50 спроб
// {ts, username, ok, actorId}. Це read-side журнал: ретеншн/SIEM — T-3604
// (окремий аудит-контекст), тут — швидка марка «після підозри на компрометацію».
//
// ВАЖЛИВО: запис НЕ бере tx-клієнт з AsyncLocalStorage (currentDb). Use case
// AdminLogin виконується у транзакції PrismaUnitOfWork і для невдалих спроб
// кидає помилку ПІСЛЯ audit.record — транзакція відкочується, і записана
// всередині неї невдала спроба зникла б. Аудит входів — саме те, що має
// пережити відкат бізнес-операції, тому він завжди пише через базовий клієнт.

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { LoginAttempt, LoginAudit } from '../domain/ports';

const MAX_ENTRIES = 50;

interface AuditRow {
  ts: string;
  username: string;
  ok: boolean;
  actorId: string | null;
}

@Injectable()
export class PrismaLoginAudit implements LoginAudit {
  constructor(private readonly prisma: PrismaService) {}

  async record(userId: string, attempt: LoginAttempt): Promise<void> {
    const existing = await this.prisma.appSetting.findUnique({ where: { key: this.key(userId) } });
    const entries = this.entriesOf((existing?.value as { entries?: AuditRow[] } | null)?.entries);
    entries.push({
      ts: attempt.ts.toISOString(),
      username: attempt.username,
      ok: attempt.ok,
      actorId: attempt.actorId,
    });
    const value = this.asJson(entries.slice(-MAX_ENTRIES));
    await this.prisma.appSetting.upsert({
      where: { key: this.key(userId) },
      create: { key: this.key(userId), value },
      update: { value },
    });
  }

  /** Читання — поза бізнес-транзакцією немає сенсу, але tx-клієнт тут безпечний
   * і корисний для консистентності, тож беремо як є (єдиний виклик контролера). */
  async list(userId: string, limit: number): Promise<LoginAttempt[]> {
    const row = await this.prisma.appSetting.findUnique({ where: { key: this.key(userId) } });
    return this.entriesOf((row?.value as { entries?: AuditRow[] } | null)?.entries)
      .slice(-Math.min(limit, MAX_ENTRIES))
      .reverse()
      .map((e) => ({ ts: new Date(e.ts), username: e.username, ok: e.ok, actorId: e.actorId }));
  }

  private key(userId: string): string {
    return `admin.login_audit:${userId}`;
  }

  private entriesOf(value: unknown): AuditRow[] {
    return Array.isArray(value) ? (value as AuditRow[]) : [];
  }

  /** Prisma JSON хоче об'єкт з index-сигнатурою — обгортаємо масив. */
  private asJson(entries: AuditRow[]): Prisma.InputJsonValue {
    return { entries } as unknown as Prisma.InputJsonValue;
  }
}
