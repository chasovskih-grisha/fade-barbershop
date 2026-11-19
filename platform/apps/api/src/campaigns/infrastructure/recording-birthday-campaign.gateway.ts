// T-4459: приймач привітань у пам'яті. Реальний шлюз (SMS/email/push, T-032/080)
// підключається заміною одного провайдера; контракт уже зафіксований тестами.
import { Injectable } from '@nestjs/common';
import type {
  BirthdayCampaignGateway,
  BirthdayDeliveryRecord,
} from '../application/birthday-campaign.service';
import type { BirthdayCampaignChannel } from '../domain/birthday-campaign';

@Injectable()
export class RecordingBirthdayCampaignGateway implements BirthdayCampaignGateway {
  private readonly sends: Array<{
    clientId: string;
    channels: BirthdayCampaignChannel[];
    text: string;
    occurrenceYear: number;
    discountPercent: number;
  }> = [];

  async send(input: {
    clientId: string;
    channels: BirthdayCampaignChannel[];
    text: string;
    occurrenceYear: number;
    discountPercent: number;
  }): Promise<void> {
    this.sends.push({ ...input, channels: [...input.channels] });
  }

  /** Для тестів і адмін-аудиту: що вже прийнято шлюзом. */
  list(): Array<BirthdayDeliveryRecord & { channels: BirthdayCampaignChannel[] }> {
    return this.sends.map((send) => ({
      fingerprint: '',
      clientId: send.clientId,
      year: send.occurrenceYear,
      at: new Date(0),
      channels: [...send.channels],
      discountPercent: send.discountPercent,
      text: send.text,
    }));
  }
}
