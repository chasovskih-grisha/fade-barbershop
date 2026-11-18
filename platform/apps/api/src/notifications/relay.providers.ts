// Провайдери релея outbox notifications (T-4608, розширено T-080, T-4462): реєстр
// споживачів за типами подій (outbox-routing) і диспетчер із таймером.
// Винесено з notifications.providers.ts за LOC-гейтом.
import { PrismaService } from '../shared/prisma/prisma.service';
import { OutboxNotificationsDispatcher } from './infrastructure/outbox-dispatcher';
import type { OutboxConsumers } from './infrastructure/outbox-routing';
import { SendBookingConfirmation } from './application/send-booking-confirmation';
import { NewDeviceAlert } from './application/security-alert';
import { ScheduleAppointmentReminder } from './application/schedule-appointment-reminder';
import { SendAppointmentReminder } from './application/send-appointment-reminder';
import { LoyaltyNotificationHandler } from './application/loyalty-notification';
import { AppointmentPushNotification } from './application/appointment-push';
import { OUTBOX_CONSUMERS } from './notifications.tokens';

/** Реєстр споживачів релея: тип події → споживачі (outbox-routing). */
export const OutboxConsumersProvider = {
  provide: OUTBOX_CONSUMERS,
  useFactory: (...deps: unknown[]) => {
    const [confirmations, alerts, schedule, reminders, loyalty, appointmentPush] = deps as [
      SendBookingConfirmation,
      NewDeviceAlert,
      ScheduleAppointmentReminder,
      SendAppointmentReminder,
      LoyaltyNotificationHandler,
      AppointmentPushNotification,
    ];
    const consumers: OutboxConsumers = {
      confirmations,
      alerts,
      schedule,
      reminders,
      loyalty,
      appointmentPush,
    };
    return consumers;
  },
  inject: [
    SendBookingConfirmation,
    NewDeviceAlert,
    ScheduleAppointmentReminder,
    SendAppointmentReminder,
    LoyaltyNotificationHandler,
    AppointmentPushNotification,
  ],
};

/** Релей: таймер життя модуля, сам прохід — outbox-poll.ts. */
export const OutboxDispatcherProvider = {
  provide: OutboxNotificationsDispatcher,
  useFactory: (...deps: unknown[]) => {
    const [prisma, consumers] = deps as [PrismaService, OutboxConsumers];
    return new OutboxNotificationsDispatcher(prisma, consumers);
  },
  inject: [PrismaService, OUTBOX_CONSUMERS],
};

export const relayProviders = [OutboxConsumersProvider, OutboxDispatcherProvider];
