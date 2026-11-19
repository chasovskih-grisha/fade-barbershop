// SMS-адаптер пропозицій черги (T-4453): домен вирішує, кому запропонувати,
// а канал лише доставляє текст. Використовує наявні сендери
// (SendWaitlistOfferSms зі своїм sendExpired), тож окремих шаблонів не плодимо.
// Тепер також відправляє push-повіщення клієнтам, що мають зареєстровані пристрої.

import type { WaitlistOfferNotifier } from './waitlist-offer-notifier';
import { SendWaitlistOfferSms } from './send-sms.use-case';
import { ExpoPushSender } from '../infrastructure/expo-push-sender';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaDevicePushTokens } from '../infrastructure/device-push-tokens';
import { PrismaJournal } from '../infrastructure/journal';

const PUSH_TITLE = 'Ваше місце у черзі';
const PUSH_BODY_OFFER = 'Для вас з\'явився свободний слот! Будь ласка, підтвердіть у течение 10 хвилин.';
const PUSH_BODY_EXPIRED = 'Ваша пропозиція у черзі прострочилася. Нова пропозиція буде надіслана першому в черзі.';

/** SMS-адаптер пропозицій черги з поддержкою push. */
@Injectable()
export class SmsWaitlistOfferNotifier implements WaitlistOfferNotifier {
  constructor(
    private readonly sms: SendWaitlistOfferSms,
    private readonly phones: WaitlistClientPhones,
    private readonly prisma: PrismaService,
    private readonly pushSender: ExpoPushSender,
    private readonly deviceTokens: PrismaDevicePushTokens,
    private readonly journal: PrismaJournal,
  ) {}

  async sendOffer(input: {
    entryId: string;
    clientId: string;
    slot: any; // FreedSlot
    expiresAt: Date;
  }): Promise<void> {
    // Send SMS
    const phone = await this.phones.findPhone(input.clientId);
    if (phone) {
      await this.sms.send(phone, {
        start: input.slot.date ? `${input.slot.date}T${input.slot.start}:00` : '',
        expiresAt: input.expiresAt,
      });
    }

    // Send push notification
    const tokens = await this.deviceTokens.findTokensByUserId(input.clientId);
    if (tokens.length > 0) {
      await this.pushSender.send(
        tokens.map((token) => ({
          token,
          title: PUSH_TITLE,
          body: PUSH_BODY_OFFER,
        }))
      );

      await this.journal.markSent({
        eventId: input.entryId,
        type: 'scheduling.waitlist.entry_created',
        channel: 'push',
        recipient: `${tokens.length} пристроїв`,
        subject: PUSH_TITLE,
      });
    }
  }

  async sendExpired(input: { entryId: string; clientId: string }): Promise<void> {
    // Send SMS
    const phone = await this.phones.findPhone(input.clientId);
    if (phone) {
      await this.sms.sendExpired(phone);
    }

    // Send push notification
    const tokens = await this.deviceTokens.findTokensByUserId(input.clientId);
    if (tokens.length > 0) {
      await this.pushSender.send(
        tokens.map((token) => ({
          token,
          title: PUSH_TITLE,
          body: PUSH_BODY_EXPIRED,
        }))
      );

      await this.journal.markSent({
        eventId: input.entryId,
        type: 'scheduling.waitlist.entry_created',
        channel: 'push',
        recipient: `${tokens.length} пристроїв`,
        subject: PUSH_TITLE,
      });
    }
  }
}