// CombinedWaitlistOfferNotifier — посилає SMS і push-пропозицію черги.
// Реалізує WaitlistOfferNotifier, делегує обох адператорах.

import { Injectable } from '@nestjs/common';
import type { WaitlistOfferNotifier } from '../../scheduling/application/waitlist-offer.use-case';
import { SmsWaitlistOfferNotifier } from './waitlist-offer-notifier';
import { WaitlistOfferPushNotifier } from './waitlist-offer-push-notifier';

@Injectable()
export class CombinedWaitlistOfferNotifier implements WaitlistOfferNotifier {
  constructor(
    private readonly smsNotifier: SmsWaitlistOfferNotifier,
    private readonly pushNotifier: WaitlistOfferPushNotifier
  ) {}

  async sendOffer(input: {
    entryId: string;
    clientId: string;
    slot: any; // FreedSlot
    expiresAt: Date;
  }): Promise<void> {
    // Send SMS in parallel with push
    await this.smsNotifier.sendOffer(input);
    // Send push notification
    await this.pushNotifier.sendOffer(input);
  }

  async sendExpired(input: { entryId: string; clientId: string }): Promise<void> {
    // Send SMS in parallel with push
    await this.smsNotifier.sendExpired(input);
    // Send push notification
    await this.pushNotifier.sendExpired(input);
  }
}
