import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VisitChatPanel, CHAT_UNAVAILABLE_TEXT } from '../VisitChatPanel';

type Call = { url: string; method: string; body: Record<string, unknown> | null };

const HISTORY = {
  conversationId: 'conv-1',
  visitId: 'visit-1',
  clientId: 'me',
  barberId: 'barber-1',
  messages: [
    { id: 'm1', senderId: 'barber-1', senderRole: 'barber', body: 'Буду о 14:00', clientMessageId: null, createdAt: '2026-11-26T09:00:00.000Z' },
    { id: 'm2', senderId: 'me', senderRole: 'client', body: 'Дякую!', clientMessageId: null, createdAt: '2026-11-26T09:05:00.000Z' },
  ],
};

type Reply = { ok: boolean; status: number; json: () => Promise<unknown> };

const ok = (data: unknown, status = 200): Reply => ({ ok: true, status, json: () => Promise.resolve(data) });

let calls: Call[] = [];
let respond: (call: Call) => Promise<Reply> = () => Promise.resolve(ok(HISTORY));

beforeEach(() => {
  calls = [];
  respond = () => Promise.resolve(ok(HISTORY));
  // @ts-expect-error - мок глобального fetch
  global.fetch = jest.fn((url: string, init?: { method?: string; body?: string }) => {
    const call = { url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(init.body) : null };
    calls.push(call);
    return respond(call);
  });
});

describe('Чат візиту на картці (T-081b)', () => {
  it('не тягне історію до відкриття, а потім показує обидві сторони', async () => {
    render(<VisitChatPanel visitId="visit-1" />);
    expect(calls).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Чат із майстром' }));
    expect(await screen.findByText('Буду о 14:00')).toBeTruthy();
    expect(screen.getByText('Дякую!')).toBeTruthy();
    expect(screen.getByLabelText('Повідомлення майстру')).toBeTruthy();
    expect(calls[0]).toMatchObject({ url: '/messaging/visits/visit-1/messages', method: 'GET' });
  });

  it('надсилає повідомлення з clientMessageId і додає його в історію', async () => {
    respond = (call) =>
      call.method === 'POST'
        ? Promise.resolve(ok({ duplicate: false, message: { id: 'm3', senderId: 'me', senderRole: 'client', body: 'О котрій?', clientMessageId: 'cid', createdAt: '2026-11-26T09:10:00.000Z' } }, 201))
        : Promise.resolve(ok(HISTORY));
    render(<VisitChatPanel visitId="visit-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Чат із майстром' }));
    await screen.findByText('Буду о 14:00');

    fireEvent.change(screen.getByLabelText('Повідомлення майстру'), { target: { value: 'О котрій?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Надіслати' }));

    expect(await screen.findByText('О котрій?')).toBeTruthy();
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.url).toBe('/messaging/visits/visit-1/messages');
    expect(post?.body).toMatchObject({ body: 'О котрій?' });
    expect(typeof post?.body?.clientMessageId).toBe('string');
  });

  it('403 на історію показує «чат недоступний» замість зламаної картки', async () => {
    respond = () => Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({}) });
    render(<VisitChatPanel visitId="visit-foreign" />);
    fireEvent.click(screen.getByRole('button', { name: 'Чат із майстром' }));

    await waitFor(() => expect(screen.getByText(CHAT_UNAVAILABLE_TEXT)).toBeTruthy());
    expect(screen.queryByLabelText('Повідомлення майстру')).toBeNull();
    expect(screen.getByTestId('visit-chat')).toBeTruthy();
  });
});
