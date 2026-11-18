import { Module } from '@nestjs/common';
import { MessagingController } from './infrastructure/messaging.controller';
import { MessagingService } from './application/messaging.service';

@Module({
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
