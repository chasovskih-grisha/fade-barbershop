// T-4459: модуль авто-кампанії «День народження». Джерело клієнтів і журнал
// in-memory до появи Prisma-таблиць надсилань; порти дозволяють заміну без
// зміни застосункового шару.
import { Module } from '@nestjs/common';
import {
  BIRTHDAY_CAMPAIGN_CLIENTS,
  BIRTHDAY_CAMPAIGN_CLOCK,
  BIRTHDAY_CAMPAIGN_GATEWAY,
  BIRTHDAY_CAMPAIGN_LOG,
  BirthdayCampaignService,
  InMemoryBirthdayCampaignClients,
  InMemoryBirthdayCampaignLog,
  type BirthdayCampaignClientSource,
} from './application/birthday-campaign.service';
import { RecordingBirthdayCampaignGateway } from './infrastructure/recording-birthday-campaign.gateway';
import { AdminBirthdayCampaignController } from './infrastructure/birthday-campaign.controller';

@Module({
  controllers: [AdminBirthdayCampaignController],
  providers: [
    BirthdayCampaignService,
    { provide: BIRTHDAY_CAMPAIGN_CLIENTS, useClass: InMemoryBirthdayCampaignClients },
    { provide: BIRTHDAY_CAMPAIGN_GATEWAY, useClass: RecordingBirthdayCampaignGateway },
    { provide: BIRTHDAY_CAMPAIGN_LOG, useClass: InMemoryBirthdayCampaignLog },
    { provide: BIRTHDAY_CAMPAIGN_CLOCK, useFactory: () => ({ now: () => new Date() }) },
  ],
  exports: [BirthdayCampaignService, BIRTHDAY_CAMPAIGN_CLIENTS],
})
export class CampaignsModule {}

export type { BirthdayCampaignClientSource };
