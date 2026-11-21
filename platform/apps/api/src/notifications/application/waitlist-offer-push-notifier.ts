// WaitlistOfferPushNotifier — доставка пропозицій черги через push (Expo).
// Сповіщає клієнта, коли йому пропонується слот у черзі, і про прострочення.
// Реалізує WaitlistOfferNotifier, використовує той самий канал, що іAppointmentPushNotification.

import { Injectable } from '@nestjs/common';
import type { WaitlistOfferNotifier } from '../../scheduling/application/waitlist-offer.use-case';
import { ExpoPushSender } from '../infrastructure/expo-push-sender';
import { PrismaDevicePushTokens } from '../infrastructure/device-push-tokens';
import { PrismaJournal } from '../infrastructure/journal';

const PUSH_TITLE = 'Ваше місце у черзі';
const PUSH_BODY_OFFER =
  "Для вас з'явився свободний слот! Будь ласка, підтвердіть у течение 10 хвилин.";
const PUSH_BODY_EXPIRED =
  'Ваша пропозиція у черзі прострочилася. Нова пропозиція буде надіслана першому в черзі.';

@Injectable()
export class WaitlistOfferPushNotifier implements WaitlistOfferNotifier {
  constructor(
    private readonly pushSender: ExpoPushSender,
    private readonly deviceTokens: PrismaDevicePushTokens,
    private readonly journal: PrismaJournal
  ) {}

  async sendOffer(input: {
    entryId: string;
    clientId: string;
    slot: any; // FreedSlot
    expiresAt: Date;
  }): Promise<void> {
    const tokens = await this.deviceTokens.findTokensByUserId(input.clientId);
    if (tokens.length === 0) {
      // No tokens - mark as sent (no devices) in journal
      await this.journal.markSent({
        eventId: input.entryId,
        type: 'scheduling.waitlist.entry_created', // using entry_created as proxy
        channel: 'none',
        recipient: '',
        subject: '',
      });
      return;
    }

    const title = PUSH_TITLE;
    const body = PUSH_BODY_OFFER;

    await this.pushSender.send(tokens.map((token) => ({ token, title, body })));

    await this.journal.markSent({
      eventId: input.entryId,
      type: 'scheduling.waitlist.entry_created',
      channel: 'push',
      recipient: `${tokens.length} пристроїв`,
      subject: title,
    });
  }

  async sendExpired(input: { entryId: string; clientId: string }): Promise<void> {
    const tokens = await this.deviceTokens.findTokensByUserId(input.clientId);
    if (tokens.length === 0) {
      await this.journal.markSent({
        eventId: input.entryId,
        type: 'scheduling.waitlist.entry_created',
        channel: 'none',
        recipient: '',
        subject: '',
      });
      return;
    }

    const title = PUSH_TITLE;
    const body = PUSH_BODY_EXPIRED;

    await this.pushSender.send(tokens.map((token) => ({ token, title, body })));

    await this.journal.markSent({
      eventId: input.entryId,
      type: 'scheduling.waitlist.entry_created',
      channel: 'push',
      recipient: `${tokens.length} пристроїв`,
      subject: title,
    });
  }
}
