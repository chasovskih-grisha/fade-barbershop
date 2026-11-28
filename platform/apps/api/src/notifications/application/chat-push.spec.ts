// ChatPushNotification (T-081): подія чату → push співрозмовнику українською,
// журнал 'push'; відписка, дубль і без пристроїв — пропуск із причиною.
import { CHAT_MESSAGE_EVENT, ChatPushNotification, chatPushBody, chatPushTitle } from './chat-push';
import type { NotificationEvent } from './send-booking-confirmation';

const TOKEN = 'ExponentPushToken[chat-device]';

const makeFakes = (
  opts: { pushEnabled?: boolean; tokens?: string[]; handled?: boolean } = {}
) => {
  const pushed: { token: string; title: string; body: string }[] = [];
  const journalRows: { eventId: string; channel: string; recipient: string; detail?: string }[] =
    [];
  const deps = {
    push: {
      send: jest.fn(async (messages: { token: string; title: string; body: string }[]) => {
        pushed.push(...messages);
      }),
    },
    devices: {
      findOtherDeviceTokens: jest.fn().mockResolvedValue([]),
      findTokensByUserId: jest
        .fn()
        .mockResolvedValue(opts.tokens === undefined ? [TOKEN] : opts.tokens),
    },
    preferences: { isPushEnabled: jest.fn().mockResolvedValue(opts.pushEnabled ?? true) },
    journal: {
      alreadyHandled: jest.fn().mockResolvedValue(opts.handled ?? false),
      markSent: jest.fn(async (record: (typeof journalRows)[number]) => {
        journalRows.push(record);
      }),
    },
  };
  return { deps, pushed, journalRows };
};

const chatEvent = (payload: Record<string, unknown>): NotificationEvent =>
  ({
    id: 'evt-chat-1',
    type: CHAT_MESSAGE_EVENT,
    aggregateId: 'conv-1',
    payload,
  }) as NotificationEvent;

describe('ChatPushNotification', () => {
  it('надсилає прев’ю повідомлення барбера на пристрої клієнта', async () => {
    const { deps, pushed, journalRows } = makeFakes();

    const outcome = await new ChatPushNotification(deps).handleOne(
      chatEvent({ recipientId: 'client-1', senderRole: 'barber', preview: 'Чекаю вас о 10:00' })
    );

    expect(outcome).toEqual({ handled: true, reason: 'sent', recipient: '1 пристроїв' });
    expect(deps.devices.findTokensByUserId).toHaveBeenCalledWith('client-1');
    expect(pushed[0]).toMatchObject({ token: TOKEN, title: 'FADE: повідомлення від барбера' });
    expect(pushed[0]?.body).toBe('Барбер: Чекаю вас о 10:00');
    expect(journalRows[0]).toMatchObject({ eventId: 'evt-chat-1', channel: 'push' });
  });

  it('поважає відписку клієнта: канал none, без push', async () => {
    const { deps, pushed, journalRows } = makeFakes({ pushEnabled: false });

    const outcome = await new ChatPushNotification(deps).handleOne(
      chatEvent({ recipientId: 'client-1', senderRole: 'barber', preview: 'Привіт' })
    );

    expect(outcome).toEqual({ handled: true, reason: 'skipped' });
    expect(pushed).toHaveLength(0);
    expect(journalRows[0]).toMatchObject({ channel: 'none', detail: 'отримувач вимкнув push' });
  });

  it('не дублює доставку за журналом і не шле без отримувача', async () => {
    const duplicate = makeFakes({ handled: true });
    expect(
      await new ChatPushNotification(duplicate.deps).handleOne(
        chatEvent({ recipientId: 'client-1', senderRole: 'barber' })
      )
    ).toEqual({ handled: false, reason: 'duplicate' });

    const orphan = makeFakes();
    expect(
      await new ChatPushNotification(orphan.deps).handleOne(chatEvent({ senderRole: 'client' }))
    ).toEqual({ handled: true, reason: 'skipped' });
    expect(orphan.pushed).toHaveLength(0);
  });

  it('тексти розрізняють автора', () => {
    expect(chatPushTitle('client')).toBe('FADE: нове повідомлення');
    expect(chatPushBody('client', 'Буду о 10')).toBe('Клієнт: Буду о 10');
    expect(chatPushBody('barber', '')).toContain('надіслав повідомлення');
  });
});
