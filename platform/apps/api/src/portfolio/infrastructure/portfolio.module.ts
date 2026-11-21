// T-190 / T-4455: HTTP-поверхня галереї (публічна, барбер, адмін) на одному
// застосуванні домену. Сховище in-memory, доки в `prisma/schema.prisma` немає
// моделей галереї — порт `PortfolioRepository` готовий під Prisma-адаптер.
import { Module } from '@nestjs/common';
import {
  AdminPortfolioController,
  BarberPortfolioController,
  PublicPortfolioController,
} from './portfolio.controller';
import {
  InMemoryPortfolioRepository,
  PORTFOLIO_REPOSITORY,
  PortfolioService,
} from '../application/portfolio.service';

@Module({
  controllers: [PublicPortfolioController, BarberPortfolioController, AdminPortfolioController],
  providers: [
    PortfolioService,
    {
      provide: PORTFOLIO_REPOSITORY,
      useFactory: () => new InMemoryPortfolioRepository(),
    },
  ],
  exports: [PortfolioService, PORTFOLIO_REPOSITORY],
})
export class PortfolioModule {}
