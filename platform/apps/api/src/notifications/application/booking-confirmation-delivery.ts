// Доставка підтвердження за каналом (виділено з send-booking-confirmation за
// LOC-гейтом): email → локація, sms → клієнт, both → обидва; null — немає
// кому слати. Падіння send прокидається нагороду (at-least-once ретрай).
import type { ConfirmationLetterData } from './booking-confirmation-template';
import {
  renderConfirmationHtml,
  renderConfirmationSubject,
  renderConfirmationText,
} from './booking-confirmation-template';
import { renderConfirmationSms, type SmsSender } from './booking-confirmation-sms';
import type { ConfirmationChannel } from '../domain/booking-confirmation-settings';
import type { EmailSender } from '../../shared/email/ports';
import type { ClientContacts, LocationContacts } from './booking-confirmation-ports';

export interface DeliveryDeps {
  email: EmailSender;
  sms: SmsSender;
  locations: LocationContacts;
  clients: ClientContacts;
}

export interface DeliveryResult {
  recipient: string;
  detail: string;
}

export interface DeliveryInput {
  channel: ConfirmationChannel;
  appointmentId: string;
  contacts: { name: string; address: string | null; email: string | null } | null;
  letterData: ConfirmationLetterData;
}

export async function deliverByChannel(
  deps: DeliveryDeps,
  input: DeliveryInput
): Promise<DeliveryResult | null> {
  const { channel, appointmentId, contacts, letterData } = input;
  const recipients: { channel: string; recipient: string; detail: string }[] = [];

  if (channel === 'email' || channel === 'both') {
    const email = contacts?.email;
    if (!email) return null;
    const subject = renderConfirmationSubject(letterData);
    await deps.email.send({
      to: email,
      subject,
      text: renderConfirmationText(letterData),
      html: renderConfirmationHtml(letterData),
    });
    recipients.push({ channel: 'email', recipient: email, detail: subject });
  }
  if (channel === 'sms' || channel === 'both') {
    const phone = await deps.clients.findPhoneByAppointmentId(appointmentId);
    if (!phone) return null;
    await deps.sms.send({ to: phone, text: renderConfirmationSms(letterData) });
    recipients.push({ channel: 'sms', recipient: phone, detail: 'SMS підтвердження' });
  }
  if (recipients.length === 0) return null;
  // both: журнал — обидва одержувачі через «, » (один eventId = одна подія).
  return {
    recipient: recipients.map((r) => r.recipient).join(', '),
    detail: recipients.map((r) => `${r.channel}: ${r.detail}`).join('; '),
  };
}
