// Стенд lifecycle e2e: bootstrap SchedulingModule (+стамп адміна / cookie-parser),
// сід фікстур, опційний перший запис і FK-чисте прибирання. Специфіка маршрутів
// і тверджень — у самих спеках; сюїтові хелпери — appointment-lifecycle.fixtures.
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { SchedulingModule } from '../scheduling.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  book,
  buildLifecycleIds,
  cleanupLifecycle,
  seedLifecycle,
  stampAdmin,
  type LifecycleIds,
} from './appointment-lifecycle.fixtures';

export interface LifecycleSuite {
  app: INestApplication;
  prisma: PrismaService;
  ids: LifecycleIds;
  /** id запису, якщо options.book задано; інакше ''. */
  bookingId: string;
  /**
   * Прибирання стенду. Безпечне до виклику: якщо `lifecycleSuite` упав у
   * `beforeAll`, сюїта не буде — і наивний `ctx.cleanup()` падав би з
   * «Cannot read properties of undefined», маскуючи справжню помилку
   * bootstrap. Тому cleanup — це функція-замикача, а не метод об'єкта.
   */
  cleanup: () => Promise<void>;
}

export interface LifecycleSuiteOptions {
  admin?: boolean;
  /** UUID for the stamped admin actor; persistence columns require a real UUID. */
  adminId?: string;
  cookies?: boolean;
  book?: { start: string; end: string; reference?: object; origin?: object };
}

/**
 * Стенд e2e: усі життєві етапи сюїти в одному виклику.
 *
 * Якщо bootstrap упав, частковий стенд (Nest app + пул Prisma) закривається
 * перед повторним кидком помилки — інакше відкриті ресурси лишаються у
 * воркері, а наступні сюїти отримують «socket hang up».
 */
export async function lifecycleSuite(options: LifecycleSuiteOptions = {}): Promise<LifecycleSuite> {
  let app: INestApplication | undefined;
  let ids: LifecycleIds | undefined;
  const prisma = (): PrismaService => {
    if (!app) throw new Error('lifecycleSuite: app не ініціалізовано');
    return app.get(PrismaService);
  };
  const cleanup = async (): Promise<void> => {
    if (ids) await cleanupLifecycle(prisma(), ids);
    if (app) await app.close();
  };

  try {
    const moduleRef = await Test.createTestingModule({ imports: [SchedulingModule] }).compile();
    app = moduleRef.createNestApplication();
    if (options.admin) stampAdmin(app, options.adminId);
    if (options.cookies) app.use(cookieParser());
    await app.init();
    ids = buildLifecycleIds();
    await seedLifecycle(prisma(), ids);
    let bookingId = '';
    if (options.book) bookingId = (await book(app, ids, options.book)).body.id;
    return { app, prisma: prisma(), ids, bookingId, cleanup };
  } catch (error) {
    await cleanup().catch(() => undefined);
    throw error;
  }
}
