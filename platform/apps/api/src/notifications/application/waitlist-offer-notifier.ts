// SMS-адаптер пропозицій черги (T-4453): домен вирішує, кому запропонувати,
// а канал лише доставляє текст. Використовує наявні сендери
// (SendWaitlistOfferSms зі своїм sendExpired), тож окремих шаблонів не плодимо.
import type { WaitlistOfferNotifier } from '../../scheduling/application/waitlist-offer.use-case';
import type { FreedSlot } from '../../scheduling/domain/waitlist-queue';
import { SendWaitlistOfferSms } from './send-sms.use-case';

/** Телефон клієнта для SMS (crm/identity). `null` — слати нікуди. */
export interface WaitlistClientPhones {
  findPhone(clientId: string): Promise<string | null>;
}

/** ISO-момент початку слота з локальних дати й часу локації. */
export function slotStartIso(slot: FreedSlot): string {
  return `${slot.date}T${slot.start}:00`;
}

export class SmsWaitlistOfferNotifier implements WaitlistOfferNotifier {
  constructor(
    private readonly sms: SendWaitlistOfferSms,
    private readonly phones: WaitlistClientPhones
  ) {}

  async sendOffer(input: {
    entryId: string;
    clientId: string;
    slot: FreedSlot;
    expiresAt: Date;
  }): Promise<void> {
    const phone = await this.phones.findPhone(input.clientId);
    if (!phone) return;
    await this.sms.send(phone, {
      start: slotStartIso(input.slot),
      expiresAt: input.expiresAt,
    });
  }

  async sendExpired(input: { entryId: string; clientId: string }): Promise<void> {
    const phone = await this.phones.findPhone(input.clientId);
    if (!phone) return;
    await this.sms.sendExpired(phone);
  }
}
