// NotificationsModule (T-4608): споживач підтверджень запису за подіями
// outbox. Канали — EmailSender (T-4408: console/mailpit/smtp за EMAIL_PROVIDER)
// і SmsSender (dev — Mailpit «SMS як email»). Канал доставки — адмін-налашту-
// вання (GET/PUT /admin/settings/booking-confirmation), змінюється без деплою.
// Поллер вмикається env NOTIFICATIONS_OUTBOX_POLL_MS (дефолт 15s, 0 — вимкнути;
// у тестах — вимкнено).
//
// T-080 додає контур нагадування: та сама подія візиту, що й підтвердження,
// планує відкладену подію «notification.reminder.due» (availableAt =
// start − leadMinutes), а релей згодом надсилає її клієнту в SMS. Канал і
// час у допуску — GET/PUT /admin/settings/appointment-reminder; маршрут
// «тип події → споживачі» тримає infrastructure/outbox-routing.ts.
import { Module } from '@nestjs/common';
import { EmailModule } from '../shared/email/email.module';
import { AdminBookingConfirmationController } from './infrastructure/admin-booking-confirmation.controller';
import { AdminAppointmentReminderController } from './infrastructure/admin-appointment-reminder.controller';
import { ClientPreferencesController } from './infrastructure/client-preferences.controller';
import { AdminNotificationReadController } from './infrastructure/admin-notifications-read';
import { SendBookingConfirmation } from './application/send-booking-confirmation';
import { notificationsProviders } from './notifications.providers';

@Module({
  imports: [EmailModule],
  controllers: [
    AdminBookingConfirmationController,
    AdminAppointmentReminderController,
    ClientPreferencesController,
    AdminNotificationReadController,
  ],
  providers: [...notificationsProviders],
  exports: [SendBookingConfirmation],
})
export class NotificationsModule {}
