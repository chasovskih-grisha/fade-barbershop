// BookingPolicyModule (T-4542): політика онлайн-букінгу — конфіг локації,
// чисті правила, передполітна перевірка й адмін-PUT. Експортує
// EvaluateOnlineBooking для шляху створення запису (ClientBookingsController).
import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaOnlineBookingStore } from './prisma-booking-policy.store';
import { EvaluateOnlineBooking } from './evaluate-online-booking';
import { ONLINE_BOOKING_STORE } from './booking-policy.ports';
import {
  AdminOnlineBookingPolicyController,
  BookingPolicyController,
} from './booking-policy.controller';

@Module({
  providers: [
    PrismaService,
    PrismaOnlineBookingStore,
    { provide: ONLINE_BOOKING_STORE, useExisting: PrismaOnlineBookingStore },
    {
      provide: EvaluateOnlineBooking,
      useFactory: (store) => new EvaluateOnlineBooking({ store }),
      inject: [ONLINE_BOOKING_STORE],
    },
  ],
  controllers: [BookingPolicyController, AdminOnlineBookingPolicyController],
  exports: [EvaluateOnlineBooking],
})
export class BookingPolicyModule {}

// Реекспорт для споживачів модуля: один імпортний шлях у DI-графі.
export { EvaluateOnlineBooking } from './evaluate-online-booking';
