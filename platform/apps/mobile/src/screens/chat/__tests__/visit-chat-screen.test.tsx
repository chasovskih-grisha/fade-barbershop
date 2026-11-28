import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import VisitChatScreen from '../VisitChatScreen';

const HISTORY = [
  { id: 'm1', senderId: 'barber-1', senderRole: 'barber' as const, body: 'Буду о 14:00', clientMessageId: null, createdAt: '2026-11-26T09:00:00.000Z' },
];

type Call = { url: string; method: string; body: Record<string, unknown> | null };
let calls: Call[] = [];
let postFails = false;

beforeEach(() => {
  calls = [];
  postFails = false;
  process.env.MOBILE_API_BASE = 'http://api.test';
  global.fetch = jest.fn(async (url: string, init?: { method?: string; body?: string }) => {
    const method = init?.method ?? 'GET';
    calls.push({ url, method, body: init?.body ? JSON.parse(init.body) : null });
    if (method === 'POST') {
      if (postFails) throw new Error('offline');
      return { ok: true, status: 201, json: async () => ({ duplicate: false, message: HISTORY[0] }) };
    }
    return { ok: true, status: 200, json: async () => ({ messages: HISTORY }) };
  }) as unknown as typeof fetch;
});

afterEach(() => {
  delete process.env.MOBILE_API_BASE;
});

describe('Екран чату візиту (T-081a)', () => {
  it('показує історію візиту і надсилає з clientMessageId', async () => {
    render(<VisitChatScreen visitId="visit-1" />);
    expect(await screen.findByText('Буду о 14:00')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('chat-input'), 'О котрій?');
    fireEvent.press(screen.getByText('Надіслати'));

    await waitFor(() => expect(calls.some((call) => call.method === 'POST')).toBe(true));
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.url).toBe('http://api.test/messaging/visits/visit-1/messages');
    expect(post?.body?.body).toBe('О котрій?');
    expect(typeof post?.body?.clientMessageId).toBe('string');
  });

  it('без мережі лишає повідомлення в черзі, а не губить його', async () => {
    postFails = true;
    render(<VisitChatScreen visitId="visit-2" />);
    await screen.findByText('Буду о 14:00');

    fireEvent.changeText(screen.getByTestId('chat-input'), 'Передзвоніть');
    fireEvent.press(screen.getByText('Надіслати'));

    expect(await screen.findByText('Передзвоніть')).toBeTruthy();
    expect(screen.getByText('Ви · у черзі')).toBeTruthy();
  });

  it('403 показує «чат недоступний» замість порожнього екрана', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    render(<VisitChatScreen visitId="visit-foreign" />);

    expect(await screen.findByText('Чат недоступний для цього візиту.')).toBeTruthy();
    expect(screen.queryByTestId('chat-input')).toBeNull();
  });
});
