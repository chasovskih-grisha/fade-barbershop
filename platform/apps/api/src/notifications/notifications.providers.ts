// Провайдери контексту notifications (T-4608, T-4462). Винесено з notifications.module.ts
// за LOC-гейтом; нагадування T-080 — у appointment-reminder.providers.ts.
// Збірка deps одним масивом (гейт max-params): фабрика дістає позиційно.
import { PrismaService } from '../shared/prisma/prisma.service';
import { EMAIL_SENDER } from '../shared/email/email.tokens';
import { MailpitSmsSender } from './infrastructure/mailpit-sms-sender';
import { PrismaUserEmails } from './infrastructure/user-emails';
import { PrismaDevicePushTokens } from './infrastructure/device-push-tokens';
import { PushSenderFactory } from './infrastructure/push-sender.factory';
import { PrismaBookingConfirmationSettings } from './infrastructure/prisma-booking-confirmation-settings';
import { PrismaClientContacts } from './infrastructure/client-contacts';
import { PrismaNotificationJournal } from './infrastructure/notification-journal';
import { PrismaLocationContacts } from './infrastructure/location-contacts';
import { PrismaClientPreferences } from './infrastructure/prisma-client-preferences';
import {
  SendBookingConfirmation,
  type BookingConfirmationDeps,
} from './application/send-booking-confirmation';
import { NewDeviceAlert, type SecurityAlertDeps } from './application/security-alert';
import { LoyaltyNotificationHandler } from './application/loyalty-notification';
import type { LoyaltyNotificationDeps } from './application/loyalty-notification-ports';
import { LoyaltyCounter } from '../../loyalty/loyalty.service';
import { PUSH_SENDER, SMS_SENDER } from './notifications.tokens';
import { LOYALTY_COUNTER } from './notifications.tokens';

/** SMS у dev — Mailpit «SMS як email» (у prod — заміна на SMS-провайдера). */
export const SmsSenderProvider = {
  provide: SMS_SENDER,
  useFactory: () => new MailpitSmsSender(process.env.MAILPIT_URL ?? 'http://localhost:19096'),
};

/** Підтвердження запису (T-4608): email офісу запису + sms клієнту. */
const BookingConfirmationProvider = {
  provide: SendBookingConfirmation,
  useFactory: (...deps: unknown[]) => {
    const [email, sms, journal, locations, clients, settings] = deps as [
      BookingConfirmationDeps['email'],
      BookingConfirmationDeps['sms'],
      BookingConfirmationDeps['journal'],
      BookingConfirmationDeps['locations'],
      BookingConfirmationDeps['clients'],
      BookingConfirmationDeps['settings'],
    ];
    return new SendBookingConfirmation({ email, sms, journal, locations, clients, settings });
  },
  inject: [
    EMAIL_SENDER,
    SMS_SENDER,
    PrismaNotificationJournal,
    PrismaLocationContacts,
    PrismaClientContacts,
    PrismaBookingConfirmationSettings,
  ],
};

/** Push-канал пристроїв (T-070/T-4422): console (dev) або expo за PUSH_PROVIDER. */
const PushSenderProvider = {
  provide: PUSH_SENDER,
  useFactory: () => new PushSenderFactory().build(process.env),
};

/** Сповіщення безпеки (T-4422): email + push на інші пристрої + журнал. */
const SecurityAlertProvider = {
  provide: NewDeviceAlert,
  useFactory: (...deps: unknown[]) => {
    const [email, push, users, devices, journal] = deps as [
      SecurityAlertDeps['email'],
      PushSender,
      SecurityAlertDeps['users'],
      SecurityAlertDeps['devices'],
      SecurityAlertDeps['journal'],
    ];
    return new NewDeviceAlert({ email, push, users, devices, journal });
  },
  inject: [
    EMAIL_SENDER,
    PUSH_SENDER,
    PrismaUserEmails,
    PrismaDevicePushTokens,
    PrismaNotificationJournal,
  ],
};

/** Сповіщення подій лояльності (T-4462): SMS + push на пристрої + журнал. */
const LoyaltyNotificationProvider = {
  provide: LoyaltyNotificationHandler,
  useFactory: (...deps: unknown[]) => {
    const [sms, push, clients, devices, journal] = deps as [
      LoyaltyNotificationDeps['sms'],
      LoyaltyNotificationDeps['push'],
      LoyaltyNotificationDeps['clients'],
      LoyaltyNotificationDeps['devices'],
      LoyaltyNotificationDeps['journal'],
    ];
    return new LoyaltyNotificationHandler({ sms, push, clients, devices, journal });
  },
  inject: [
    SMS_SENDER,
    PUSH_SENDER,
    PrismaClientContacts,
    PrismaDevicePushTokens,
    PrismaNotificationJournal,
  ],
};

export const LoyaltyCounterProvider = {
  provide: LOYALTY_COUNTER,
  useValue: new LoyaltyCounter(),
};

export const notificationsProviders = [
  PrismaService,
  PrismaNotificationJournal,
  PrismaLocationContacts,
  PrismaClientContacts,
  PrismaClientPreferences,
  PrismaUserEmails,
  PrismaDevicePushTokens,
  PrismaBookingConfirmationSettings,
  SmsSenderProvider,
  PushSenderProvider,
  BookingConfirmationProvider,
  SecurityAlertProvider,
  LoyaltyNotificationProvider,
  LoyaltyCounterProvider,
  ...appointmentReminderProviders,
  ...appointmentPushProviders,
  ...relayProviders,
];
