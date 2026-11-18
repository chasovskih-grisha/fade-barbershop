// Провайдери нагадування про візит (T-080): налаштування, планувальник
// відкладеної події та споживач reminder.due. Винесено з notifications.providers
// за LOC-гейтом; маршрут події — infrastructure/outbox-routing.ts.
import { PrismaNotificationJournal } from './infrastructure/notification-journal';
import { PrismaClientContacts } from './infrastructure/client-contacts';
import { PrismaLocationContacts } from './infrastructure/location-contacts';
import { PrismaAppointmentReminderSettings } from './infrastructure/prisma-appointment-reminder-settings';
import { PrismaReminderSchedule } from './infrastructure/prisma-reminder-schedule';
import { ScheduleAppointmentReminder, type ScheduleReminderDeps } from './application/schedule-appointment-reminder';
import { SendAppointmentReminder, type SendAppointmentReminderDeps } from './application/send-appointment-reminder';
import { SMS_SENDER } from './notifications.tokens';

/** Планує відкладену подію «notification.reminder.due» за подією візиту. */
export const ScheduleReminderProvider = {
  provide: ScheduleAppointmentReminder,
  useFactory: (...deps: unknown[]) => {
    const [journal, schedule, settings] = deps as [
      ScheduleReminderDeps['journal'],
      ScheduleReminderDeps['schedule'],
      ScheduleReminderDeps['settings'],
    ];
    return new ScheduleAppointmentReminder({ journal, schedule, settings });
  },
  inject: [PrismaNotificationJournal, PrismaReminderSchedule, PrismaAppointmentReminderSettings],
};

/** Надсилає SMS, коли релей побачив відкладену подію у доступний час. */
export const SendReminderProvider = {
  provide: SendAppointmentReminder,
  useFactory: (...deps: unknown[]) => {
    const [sms, journal, clients, locations, settings] = deps as [
      SendAppointmentReminderDeps['sms'],
      SendAppointmentReminderDeps['journal'],
      SendAppointmentReminderDeps['clients'],
      SendAppointmentReminderDeps['locations'],
      SendAppointmentReminderDeps['settings'],
    ];
    return new SendAppointmentReminder({ sms, journal, clients, locations, settings });
  },
  inject: [
    SMS_SENDER,
    PrismaNotificationJournal,
    PrismaClientContacts,
    PrismaLocationContacts,
    PrismaAppointmentReminderSettings,
  ],
};

export const appointmentReminderProviders = [
  PrismaAppointmentReminderSettings,
  PrismaReminderSchedule,
  ScheduleReminderProvider,
  SendReminderProvider,
];
