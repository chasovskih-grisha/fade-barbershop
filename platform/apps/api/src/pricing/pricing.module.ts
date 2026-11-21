// PricingModule (T-4811): surge-правила — читання для розрахунку ціни й
// адмінський CRUD без окремого UI. Експортує SurgePricing для booking-флоу.
import { Module } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { PrismaSurgeRuleStore } from './infrastructure/prisma-surge-rule.store';
import { SurgeRulesController } from './infrastructure/surge-rules.controller';
import { SURGE_RULE_STORE, SurgePricing } from './application/surge-quote';

export { SurgePricing } from './application/surge-quote';

@Module({
  controllers: [SurgeRulesController],
  providers: [
    PrismaService,
    PrismaSurgeRuleStore,
    { provide: SURGE_RULE_STORE, useExisting: PrismaSurgeRuleStore },
    {
      provide: SurgePricing,
      useFactory: (store) => new SurgePricing(store),
      inject: [SURGE_RULE_STORE],
    },
  ],
  exports: [SurgePricing],
})
export class PricingModule {}
