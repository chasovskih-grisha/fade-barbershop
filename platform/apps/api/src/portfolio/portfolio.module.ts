// T-4455: модуль портфоліо барбера. Сховище, журнал згоди й годинник —
// in-memory до появи Prisma-таблиць; порти дозволяють заміну без змін у
// застосунковому шарі.
import { Module } from '@nestjs/common';
import {
  InMemoryPortfolioConsentJournal,
  InMemoryPortfolioRepository,
  PORTFOLIO_CLOCK,
  PORTFOLIO_CONSENT_JOURNAL,
  PORTFOLIO_REPOSITORY,
  PortfolioService,
} from './application/portfolio.service';
import {
  AdminPortfolioController,
  BarberPortfolioController,
  PublicPortfolioController,
} from './infrastructure/portfolio.controller';

@Module({
  controllers: [
    BarberPortfolioController,
    PublicPortfolioController,
    AdminPortfolioController,
  ],
  providers: [
    PortfolioService,
    { provide: PORTFOLIO_REPOSITORY, useClass: InMemoryPortfolioRepository },
    { provide: PORTFOLIO_CONSENT_JOURNAL, useClass: InMemoryPortfolioConsentJournal },
    { provide: PORTFOLIO_CLOCK, useFactory: () => ({ now: () => new Date() }) },
  ],
  exports: [PortfolioService],
})
export class PortfolioModule {}
