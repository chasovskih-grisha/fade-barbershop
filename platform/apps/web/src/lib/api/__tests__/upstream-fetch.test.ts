import { upstreamFetch } from '@/lib/api/upstream-fetch';

const jsonResponse = (body: unknown, status = 200): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('upstreamFetch', () => {
  it('performs fetch with default GET method and timeout', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }, 200));

    const res = await upstreamFetch('http://localhost:13000/test');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toBe('http://localhost:13000/test');
    expect(callArgs[1].method).toBe('GET');
    expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
  });

  it('serializes JSON body correctly when provided as object', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ updated: true }, 200));

    const res = await upstreamFetch('http://localhost:13000/test', {
      method: 'PATCH',
      body: { name: 'New Name' },
      headers: { Authorization: 'Bearer token' },
    });

    expect(res.status).toBe(200);
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[1].method).toBe('PATCH');
    expect(callArgs[1].body).toBe(JSON.stringify({ name: 'New Name' }));
    expect(callArgs[1].headers).toEqual({ Authorization: 'Bearer token' });
  });

  it('throws timeout error on AbortError', async () => {
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    fetchMock.mockRejectedValue(abortError);

    await expect(upstreamFetch('http://localhost:13000/slow', { timeoutMs: 50 })).rejects.toThrow(
      'Upstream request timeout after 50ms'
    );
  });

  it('propagates other errors directly', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network error'));

    await expect(upstreamFetch('http://localhost:13000/error')).rejects.toThrow('Network error');
  });
});
