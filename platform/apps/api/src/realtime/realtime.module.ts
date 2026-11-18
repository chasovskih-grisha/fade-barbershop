// RealtimeModule (T-045): живий потік адмінки. Релей outbox-watcher читає нові
// події візитів і кладе їх у AdminLiveFeed, а SSE-контролер роздає підписникам.
// PrismaService реєструється локально (патерн інших контекстів: кожен модуль
// тримає власний provider-токен, спільного @Global PrismaModule немає).
// Релей — фабрика (як relay.providers.ts): третій параметр — го́динник, його
// Nest не інжектить, тож клас не можна віддавати як class-provider.
import { Module } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { AdminLiveController } from './admin-live.controller';
import { AdminLiveFeed } from './admin-live-feed';
import { OutboxLiveWatcher } from './outbox-live-watcher';

const OutboxLiveWatcherProvider = {
  provide: OutboxLiveWatcher,
  useFactory: (prisma: PrismaService, feed: AdminLiveFeed) =>
    new OutboxLiveWatcher(prisma, feed, () => new Date()),
  inject: [PrismaService, AdminLiveFeed],
};

@Module({
  controllers: [AdminLiveController],
  providers: [PrismaService, AdminLiveFeed, OutboxLiveWatcherProvider],
  exports: [AdminLiveFeed],
})
export class RealtimeModule {}
