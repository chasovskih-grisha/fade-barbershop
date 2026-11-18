// Two-way SMS Service (T-???)
// Booking confirmations, reminder 24h before, waitlist position updates,
// and opt-in marketing. Depends on T-080 push notification infrastructure.

import { SmsSender } from './booking-confirmation-sms';
import { SmsInput } from './booking-confirmation-sms';
import { renderConfirmationSms, renderReminderSms } from './booking-confirmation-sms';
import { renderReminderSms as renderOldReminderSms } from './appointment-reminder-sms';
import { ConfirmationLetterData } from './booking-confirmation-ports';
import { Booking, BookingRepository } from '../domain/booking';
import { ClientProfile } from '../domain/client-profile';
import { prisma } from '../../index';

/** SMS Input for booking confirmation */
export class SendBookingConfirmationSms {
  constructor(private readonly sms: SmsSender, private readonly clients: any, private readonly letterData: ConfirmationLetterData) {}

  async send(to: string): Promise<void> {
    const text = renderConfirmationSms(this.letterData);
    await this.sms.send({ to, text });
  }
}

/** SMS Input for appointment reminder 24h before */
export class SendReminderSms {
  constructor(private readonly sms: SmsSender, private readonly clients: any, private readonly letterData: ConfirmationLetterData) {}

  async send(to: string, leadMinutes: number = 24 * 60): Promise<void> {
    const text = renderReminderSms(this.letterData);
    await this.sms.send({ to, text });
  }
}

/** SMS Input for waitlist position update */
export class SendWaitlistUpdateSms {
  constructor(private readonly sms: SmsSender, private readonly clients: any) {}

  async send(to: string, position: number, barberName: string, serviceName: string): Promise<void> {
    const text = `FADE: ви вже на вичі waited. Ваша позиція: #${position}. Barber: ${barberName}. Слуга: ${serviceName}. Ми повідомимо, коли slot відбудеться.`;
    await this.sms.send({ to, text });
  }
}

/** SMS Input for marketing opt-in/out */
export class SendSmketingSms {
  constructor(private readonly sms: SmsSender) {}

  async sendOptIn(to: string): Promise<void> {
    const text = `FADE: Ви підписалися на маркетингові SMS від Fade. Щоб відключити, reply STOP.`;
    await this.sms.send({ to, text });
  }

  async sendOptOut(to: string): Promise<void> {
    const text = `FADE: Ви відписалися від маркетингових SMS. Ми уважечого ставимо ваш вибір.`;
    await this.sms.send({ to, text });
  }
}

/** Handler for booking confirmation SMS */
export class BookingConfirmationHandler {
  constructor(
    private readonly sms: SmsSender,
    private readonly clients: any,
    private readonly locations: any,
    private readonly services: any
  ) {}

  async handle(event: any): Promise<{ success: boolean; detail: string }> {
    const payload = event.payload;
    const clientId = payload.clientId;

    // Get client phone
    const phone = await this.clients.findPhoneByAppointmentId(payload.appointmentId);
    if (!phone) {
      return { success: false, detail: 'No phone number for client' };
    }

    // Get letter data
    const contacts = await this.locations.findContacts(payload.locationId);
    const letterData: ConfirmationLetterData = {
      locationName: contacts?.name || '',
      locationAddress: contacts?.address || '',
      serviceName: payload.serviceId ? 'Haircut' : '',
      start: payload.start,
    };

    // Send SMS confirmation
    await new SendBookingConfirmationSms(this.sms, this.clients, letterData).send(phone);

    return { success: true, detail: 'SMS confirmation sent' };
  }
}

/** Handler for appointment reminder SMS (24h before) */
export class ReminderHandler {
  constructor(
    private readonly sms: SmsSender,
    private readonly clients: any,
    private readonly locations: any
  ) {}

  async handle(event: any, leadMinutes: number = 24 * 60): Promise<{ success: boolean; detail: string }> {
    const payload = event.payload;
    const clientId = payload.clientId;

    // Get client phone
    const phone = await this.clients.findPhoneByAppointmentId(payload.appointmentId);
    if (!phone) {
      return { success: false, detail: 'No phone number for client' };
    }

    // Get letter data
    const contacts = await this.locations.findContacts(payload.locationId);
    const letterData: ConfirmationLetterData = {
      locationName: contacts?.name || '',
      locationAddress: contacts?.address || '',
      serviceName: payload.serviceId ? 'Haircut' : '',
      start: payload.start,
    };

    // Send SMS reminder
    await new SendReminderSms(this.sms, this.clients, letterData).send(phone, leadMinutes);

    return { success: true, detail: 'SMS reminder sent' };
  }
}

/** Handler for waitlist position update SMS */
export class WaitlistUpdateHandler {
  constructor(
    private readonly sms: SmsSender,
    private readonly clients: any
  ) {}

  async handle(event: any): Promise<{ success: boolean; detail: string }> {
    const payload = event.payload;
    const clientId = payload.clientId;

    // Get client phone
    const phone = await this.clients.findPhoneByAppointmentId(payload.appointmentId);
    if (!phone) {
      return { success: false, detail: 'No phone number for client' };
    }

    // Get waitlist position and barber info
    const position = payload.position ?? 1;
    const barberName = payload.barberName ?? 'Barber';
    const serviceName = payload.serviceName ?? 'Service';

    // Send SMS waitlist update
    await new SendWaitlistUpdateSms(this.sms, this.clients).send(phone, position, barberName, serviceName);

    return { success: true, detail: 'SMS waitlist update sent' };
  }
}

/** Handler for SMS marketing opt-in/opt-out */
export class MarketingSmsHandler {
  constructor(
    private readonly sms: SmsSender,
    private readonly prisma: any
  ) {}

  async handleOptIn(event: any): Promise<{ success: boolean; detail: string }> {
    const clientId = event.payload.clientId;

    // Record opt-in in database
    await this.prisma.clientProfile.upsert({
      where: { clientId },
      update: { smsMarketingOptIn: true },
      create: { clientId, smsMarketingOptIn: true },
    });

    // Send opt-in confirmation
    await this.sms.send({
      to: event.payload.phone,
      text: 'FADE: Ви підписалися на маркетингові SMS від Fade. Щоб відключити, reply STOP.',
    });

    return { success: true, detail: 'SMS marketing opt-in recorded' };
  }

  async handleOptOut(event: any): Promise<{ success: boolean; detail: string }> {
    const clientId = event.payload.clientId;

    // Record opt-out in database
    await this.prisma.clientProfile.upsert({
      where: { clientId },
      update: { smsMarketingOptOut: true },
      create: { clientId, smsMarketingOptOut: true },
    });

    // Send opt-out confirmation
    await this.sms.send({
      to: event.payload.phone,
      text: 'FADE: Ви відписалися від маркетингових SMS. Ми уважечого ставимо ваш вибір.',
    });

    return { success: true, detail: 'SMS marketing opt-out recorded' };
  }
}

/** Factory functions */
export function createBookingConfirmationHandler(sms: SmsSender, clients: any, locations: any, services: any) {
  return new BookingConfirmationHandler(sms, clients, locations, services);
}

export function createReminderHandler(sms: SmsSender, clients: any, locations: any) {
  return new ReminderHandler(sms, clients, locations);
}

export function createWaitlistUpdateHandler(sms: SmsSender, clients: any) {
  return new WaitlistUpdateHandler(sms, clients);
}

export function createMarketingSmsHandler(sms: SmsSender, prisma: any) {
  return new MarketingSmsHandler(sms, prisma);
}