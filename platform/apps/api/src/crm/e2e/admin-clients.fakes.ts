// Фейки й harness для admin-clients e2e: реальна DI-онтентнешна (CrmModule збирає
// свої хендлери сам), але клієнти — в пам'яті, а адмін-сесія — фейкова. Спека
// перевіряє HTTP-контракт CRM-ендпоинтів і guard, а не БД.
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { ClientProfile } from '../domain/client-profile';
import type { ClientId } from '../domain/client-profile.types';
import type { ClientProfileRepository } from '../domain/client-profile.repository';
import { hashToken } from '../../identity/domain/otp-code';
import { PrismaUserRepository } from '../../identity/infrastructure/prisma-adapters';
import { PrismaSessionRepository } from '../../identity/infrastructure/prisma-session-repository';
import { IdentityModule } from '../../identity/infrastructure/identity.module';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { CrmModule } from '../crm.module';
import { SystemClock } from '../system-clock';
import { PrismaClientProfileRepository } from '../infrastructure/prisma-client-profile.repository';
import { PrismaOutboxPublisher } from '../prisma-outbox-publisher';
import { CLIENT_LIST_READER } from '../application/client-list-reader';
import { seededClientList } from './admin-clients.list-fakes';

const FIXED_NOW = new Date('2026-09-29T10:00:00.000Z');

/**
 * Фіксований «зараз» для вікна підсумків (T-4606b): сідовані візити лежать у
 * 2026-09/10, тож без фіксації годинника перевірка 7d/30d залежала б від дати
 * прогону. `CLIENT_LIST_CLOCK` — аліас на цей самий провайдер (crm.module).
 */
export const SUMMARY_NOW = new Date('2026-10-10T00:00:00.000Z');

/** Cookie з токеном, якийresolveAdminSession розпізнає як валідну сесію. */
export const ADMIN_COOKIE = 'fadoidx=admin-token';

export class MemProfiles implements ClientProfileRepository {
  store = new Map<string, ClientProfile>();
  async findById(id: ClientId) {
    return this.store.get(id) ?? null;
  }
  async findByPhone(phone: string) {
    return [...this.store.values()].find((p) => p.phone === phone) ?? null;
  }
  async findByUserId(userId: string) {
    return [...this.store.values()].find((p) => p.userId === userId) ?? null;
  }
  async save(profile: ClientProfile) {
    this.store.set(profile.id, profile);
  }
  async list() {
    return [...this.store.values()];
  }
}

/** Репозиторій з одним відомим клієнтом p-1 (усі інші айденти → 404). */
export function seededProfiles(): MemProfiles {
  const profiles = new MemProfiles();
  profiles.store.set(
    'p-1' as ClientId,
    ClientProfile.reconstitute({
      id: 'p-1' as ClientId,
      userId: 'u-1',
      name: 'Олексій Петренко',
      phone: '+380672222222',
      preferences: [],
      notes: [],
      vipDiscountPercent: 10,
      loyaltyVisitsCount: 2,
      createdAt: FIXED_NOW,
      updatedAt: FIXED_NOW,
    })
  );
  return profiles;
}

/**
 * Тестовий модуль для admin/clients. Підміняємо лише порти (сховище, outbox,
 * uow) та репозиторії сесій — набір хендлерів збирає сам CrmModule, тож спека
 * перевіряє реальну DI-збірку, а не підміну токена ADMIN_CLIENTS_HANDLERS.
 *
 * Важливо: тут НЕ AppModule. Він піднімає всі 12 модулів застосунку, тож
 * ця сюїта була єдиною з реальним PrismaService, Redis-геокодером і пулом
 * з'єднань — на паралельному прогоні вона давала 503/«socket hang up» усім
 * сусіднім сюїтам воркера. IdentityModule потрібен заради глобального
 * AdminSessionGuard (APP_GUARD), а не заради репозиторії (вони підміняються).
 */
export function crmTestingModule(): TestingModuleBuilder {
  return Test.createTestingModule({ imports: [CrmModule, IdentityModule] })
    .overrideProvider(PrismaClientProfileRepository)
    .useValue(seededProfiles())
    .overrideProvider(CLIENT_LIST_READER)
    .useValue(seededClientList())
    .overrideProvider(PrismaOutboxPublisher)
    .useValue({ append: async () => undefined })
    .overrideProvider(PrismaUnitOfWork)
    .useValue({ run: async (work: () => Promise<unknown>) => work() })
    .overrideProvider(SystemClock)
    .useValue({ now: () => SUMMARY_NOW })
    .overrideProvider(PrismaSessionRepository)
    .useValue({
      findByTokenHash: async (tokenHash: string) =>
        tokenHash === hashToken('admin-token')
          ? { userId: 'admin-id', channel: 'admin', revokedAt: null }
          : null,
    })
    .overrideProvider(PrismaUserRepository)
    .useValue({ findById: async (id: string) => ({ id, role: 'admin', active: true }) });
}
