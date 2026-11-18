// Wiring-регресія: модуль резолвить контролер, шину й релей, а поллер не
// стартує в тестовому середовищі (інакше jest ловив би фонові опитування БД).
import { Test } from '@nestjs/testing';
import { PrismaService } from '../shared/prisma/prisma.service';
import { AdminLiveController } from './admin-live.controller';
import { AdminLiveFeed } from './admin-live-feed';
import { OutboxLiveWatcher } from './outbox-live-watcher';
import { RealtimeModule } from './realtime.module';

describe('RealtimeModule wiring', () => {
  it('резолвить контролер, шину й релей; автостарт у тестах бездіяльний', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [RealtimeModule] })
      .overrideProvider(PrismaService)
      .useValue({ outboxMessage: { findMany: jest.fn() } })
      .compile();

    expect(moduleRef.get(AdminLiveController)).toBeInstanceOf(AdminLiveController);
    expect(moduleRef.get(AdminLiveFeed)).toBeInstanceOf(AdminLiveFeed);
    expect(() => moduleRef.get(OutboxLiveWatcher).onApplicationBootstrap()).not.toThrow();

    await moduleRef.close();
  });
});
