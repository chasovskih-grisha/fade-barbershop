import { ConsolePushSender } from './console-push-sender';
import { ExpoPushSender } from './expo-push-sender';
import { PushSenderFactory } from './push-sender.factory';

const fetchOk = () => jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: 'ok' }) });

describe('PushSenderFactory', () => {
  it.each([
    ['дефолт — console', {}, ConsolePushSender],
    ['PUSH_PROVIDER=expo → ExpoPushSender', { PUSH_PROVIDER: 'expo' }, ExpoPushSender],
    ['PUSH_PROVIDER=console → ConsolePushSender', { PUSH_PROVIDER: 'console' }, ConsolePushSender],
  ] as const)('%s', (_name, env, expected) => {
    expect(new PushSenderFactory().build(env)).toBeInstanceOf(expected);
  });
});

describe('ConsolePushSender', () => {
  it('логує повідомлення без помилок', async () => {
    const sender = new ConsolePushSender();
    const logSpy = jest.spyOn(sender['logger'], 'log').mockImplementation(() => {});
    await sender.send([
      { token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', title: 'Нагадування', body: 'Завтра стрижка' },
      { token: 'short', title: 'Короткий', body: 'Токен' },
    ]);
    expect(logSpy).toHaveBeenCalledTimes(2);
  });
});

describe('ExpoPushSender', () => {
  afterEach(() => jest.restoreAllMocks());

  it('нічого не шле якщо список порожній', async () => {
    const fetchMock = fetchOk();
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    const sender = new ExpoPushSender('http://endpoint');
    await sender.send([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('шле payload в Expo Push API', async () => {
    const fetchMock = fetchOk();
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    const sender = new ExpoPushSender('https://exp.host/test');
    await sender.send([
      { token: 'token-1', title: 'Візит', body: 'Чекаємо на вас' },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://exp.host/test');
    const payload = JSON.parse(String(init.body)) as Array<{
      to: string;
      title: string;
      body: string;
      sound: string;
    }>;
    expect(payload).toEqual([
      {
        to: 'token-1',
        title: 'Візит',
        body: 'Чекаємо на вас',
        sound: 'default',
      },
    ]);
  });

  it('кидає на HTTP-помилку', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 400 } as Response);
    const sender = new ExpoPushSender('https://exp.host/test');
    await expect(
      sender.send([{ token: 'token-1', title: 'Т', body: 'Б' }])
    ).rejects.toThrow('Expo push HTTP 400');
  });

  it('кидає на мережеву помилку', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    const sender = new ExpoPushSender('https://exp.host/test');
    await expect(
      sender.send([{ token: 'token-1', title: 'Т', body: 'Б' }])
    ).rejects.toThrow('network down');
  });

  it('логує не-Error кинуте як String(error)', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue('string-error' as unknown as Error);
    const sender = new ExpoPushSender('https://exp.host/test');
    await expect(
      sender.send([{ token: 'token-1', title: 'Т', body: 'Б' }])
    ).rejects.toBe('string-error');
  });
});
