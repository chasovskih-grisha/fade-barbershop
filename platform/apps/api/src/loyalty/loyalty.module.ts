import { Module } from '@nestjs/common';
import { LoyaltyNotificationController } from './loyalty.notification.controller';
import { LoyaltyNotificationDispatcher } from '../loyalty/application/loyalty-notifications';
import { NoShowPropensityController } from './loyalty.no-show-propensity.controller';
import { NoShowPropensityService } from './domain/no-show-propensity.service';

@Module({
  imports: [],
  controllers: [LoyaltyNotificationController, NoShowPropensityController],
  providers: [LoyaltyNotificationDispatcher, NoShowPropensityService],
  exports: [LoyaltyNotificationDispatcher, NoShowPropensityService],
})
export class LoyaltyModule {}