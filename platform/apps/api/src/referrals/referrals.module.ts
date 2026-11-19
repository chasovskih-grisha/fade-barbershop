// T-4457: модуль сторінки «Мій код». Сховище рефералів in-memory — у
// `prisma/schema.prisma` ще немає таблиць реферальної програми; порт
// `ReferralRepository` готовий до Prisma-адаптера.
import { Module } from '@nestjs/common';
import { InMemoryReferralRepository } from './application/in-memory-referral.repository';
import {
  RandomReferralCodeGenerator,
  REFERRAL_CODE_CLOCK,
  REFERRAL_CODE_GENERATOR,
  REFERRAL_PROGRAM_SETTINGS,
  ReferralCodePageService,
} from './application/referral-code-page.service';
import { DEFAULT_REFERRAL_PROGRAM_CONFIG } from './domain/referral-code-page';
import { ReferralCodePageController } from './infrastructure/referral-code-page.controller';

@Module({
  controllers: [ReferralCodePageController],
  providers: [
    ReferralCodePageService,
    { provide: 'REFERRAL_REPOSITORY', useClass: InMemoryReferralRepository },
    { provide: REFERRAL_CODE_GENERATOR, useClass: RandomReferralCodeGenerator },
    {
      provide: REFERRAL_PROGRAM_SETTINGS,
      useFactory: () => ({ config: DEFAULT_REFERRAL_PROGRAM_CONFIG }),
    },
    { provide: REFERRAL_CODE_CLOCK, useFactory: () => ({ now: () => new Date() }) },
  ],
  exports: [ReferralCodePageService],
})
export class ReferralsModule {}
