// Специфікація SMS-шару (T-080, WTL, NSH-007): чисті тексти + обробники.
import { SMS_LENGTH_LIMIT } from './appointment-reminder-sms';
import {
  clampToSmsLimit,
  renderMarketingOptInSms,
  renderMarketingOptOutSms,
  renderNoShowSms,
  renderWaitlistOfferExpiredSms,
  renderWaitlistOfferSms,
  renderWaitlistPositionSms,
} from './sms-messages';
import {
  BookingConfirmationHandler,
  MarketingSmsHandler,
  ReminderHandler,
  SendWaitlistOfferSms,
  WaitlistUpdateHandler,
  type SmsSender,
} from './send-sms.use-case';
import type {
  ClientContacts,
  LocationContacts,
  NotificationEvent,
} from './booking-confirmation-ports';

const START = '2026-11-20T12:00:00.000Z'; // 14:00 у Києві
const PENALTY_WORDS = ['штраф', 'утримано', 'депозит', 'списано', 'пеня'];

function recorder() {
  const sent: Array<{ to: string; text: string }> = [];
  const sender: SmsSender = {
    send: async (input) => {
      sent.push(input);
    },
  };
  return { sent, sender };
}

const clientWith = (phone: string | null): ClientContacts => ({
  findPhoneByAppointmentId: async () => phone,
  findClientIdByAppointmentId: async () => 'client-1',
});

const location: LocationContacts = {
  findContacts: async () => ({ name: 'Fade Поділ', address: 'Кирилівська 41', email: null }),
};

function bookedEvent(): NotificationEvent {
  return {
    id: 'evt-1',
    type: 'scheduling.appointment.booked',
    aggregateId: 'appt-1',
    payload: { locationId: 'loc-1', serviceId: 'cut', start: START },
  };
}

describe('SMS templates', () => {
  it('renders the waitlist position with who and where', () => {
    const text = renderWaitlistPositionSms({ position: 3, barberName: 'Олег', locationName: 'Fade Поділ' });

    expect(text).toContain('ви в черзі #3');
    expect(text).toContain('барбер: Олег');
    expect(text).toContain('Fade Поділ');
    expect(text.length).toBeLessThanOrEqual(SMS_LENGTH_LIMIT);
  });

  it('never shows a position below one', () => {
    expect(renderWaitlistPositionSms({ position: 0 })).toContain('#1');
  });

  it('renders a slot offer with its acceptance deadline', () => {
    const text = renderWaitlistOfferSms({
      start: START,
      expiresAt: new Date('2026-11-19T09:15:00.000Z'), // 11:15 Київ
    });

    expect(text).toContain('є вільний слот');
    expect(text).toMatch(/Підтвердіть до 11:15/);
    expect(text).toContain('перейде наступному');
  });

  it('keeps the expired offer message free of blame', () => {
    expect(renderWaitlistOfferExpiredSms()).toContain('запропонуємо вам наступний');
  });

  it('keeps the no-show message neutral (NSH-007)', () => {
    const text = renderNoShowSms({ start: START, locationName: 'Fade Поділ' });

    expect(text).toContain('вас не було на записі');
    expect(text).toContain('Fade Поділ');
    for (const word of PENALTY_WORDS) expect(text.toLowerCase()).not.toContain(word);
  });

  it('offers a STOP keyword on marketing opt-in and a calm opt-out', () => {
    expect(renderMarketingOptInSms()).toContain('STOP');
    expect(renderMarketingOptOutSms()).toContain('відписалися');
  });

  it('clamps text to one SMS', () => {
    const long = 'а'.repeat(SMS_LENGTH_LIMIT + 50);
    expect(clampToSmsLimit(long)).toHaveLength(SMS_LENGTH_LIMIT);
    expect(clampToSmsLimit('коротко')).toBe('коротко');
  });
});

describe('SMS handlers', () => {
  it('sends the confirmation with location, service and time', async () => {
    const { sent, sender } = recorder();
    const handler = new BookingConfirmationHandler(sender, clientWith('+380671112233'), location, {
      findName: async () => 'Стрижка',
    });

    const result = await handler.handle(bookedEvent());

    expect(result).toEqual({ success: true, detail: 'SMS confirmation sent' });
    expect(sent[0]?.to).toBe('+380671112233');
    expect(sent[0]?.text).toContain('запис підтверджено');
    expect(sent[0]?.text).toContain('Стрижка');
    expect(sent[0]?.text).toContain('Кирилівська 41');
  });

  it('skips delivery when the client has no phone', async () => {
    const { sent, sender } = recorder();
    const handler = new BookingConfirmationHandler(sender, clientWith(null), location);

    await expect(handler.handle(bookedEvent())).resolves.toEqual({
      success: false,
      detail: 'No phone number for client',
    });
    expect(sent).toHaveLength(0);
  });

  it('sends the 24-hour reminder and rejects a non-positive lead time', async () => {
    const { sent, sender } = recorder();
    const handler = new ReminderHandler(sender, clientWith('+380671112233'), location);

    await handler.handle(bookedEvent());
    expect(sent[0]?.text).toContain('нагадування про візит');
    await expect(handler.handle(bookedEvent(), 0)).rejects.toThrow('Invalid reminder lead time');
  });

  it('sends the waitlist position from the event payload', async () => {
    const { sent, sender } = recorder();
    const handler = new WaitlistUpdateHandler(sender, clientWith('+380671112233'));

    const result = await handler.handle({
      id: 'evt-2',
      type: 'waitlist.position',
      aggregateId: 'wl-1',
      payload: { position: 2, serviceName: 'Борода' },
    });

    expect(result.success).toBe(true);
    expect(sent[0]?.text).toContain('#2');
    expect(sent[0]?.text).toContain('Борода');
  });

  it('sends an offer and its expiry notice', async () => {
    const { sent, sender } = recorder();
    const handler = new SendWaitlistOfferSms(sender);

    await handler.send('+380671112233', { start: START, expiresAt: new Date(START) });
    await handler.sendExpired('+380671112233');

    expect(sent[0]?.text).toContain('є вільний слот');
    expect(sent[1]?.text).toContain('час на підтвердження слота минув');
  });

  it('records consent before confirming marketing opt-in and opt-out', async () => {
    const { sent, sender } = recorder();
    const calls: Array<[string, boolean]> = [];
    const handler = new MarketingSmsHandler(sender, {
      setMarketingOptIn: async (clientId, optIn) => {
        calls.push([clientId, optIn]);
      },
    });

    await handler.handleOptIn({ clientId: 'client-1', phone: '+380671112233' });
    await handler.handleOptOut({ clientId: 'client-1', phone: '+380671112233' });

    expect(calls).toEqual([
      ['client-1', true],
      ['client-1', false],
    ]);
    expect(sent).toHaveLength(2);
    expect(sent[0]?.text).toContain('STOP');
    expect(sent[1]?.text).toContain('відписалися');
  });
});
