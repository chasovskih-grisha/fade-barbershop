import { createGeminiImageClient } from './gemini-image.client';
import { GeminiImageError } from './gemini-image.error';

const INPUT = { bytes: new Uint8Array([1, 2]), contentType: 'image/jpeg', prompt: 'crop' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createGeminiImageClient', () => {
  it('декодує inlineData і не кладе ключ у URL', async () => {
    const fetchImpl = jest.fn(async (_url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get('x-goog-api-key')).toBe('test-key');
      expect(_url).not.toContain('test-key');
      return jsonResponse({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: Buffer.from([7, 8]).toString('base64'),
                  },
                },
              ],
            },
          },
        ],
      });
    });
    const client = createGeminiImageClient({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as typeof fetch,
    });

    const image = await client.edit(INPUT);

    expect(Array.from(image.bytes)).toEqual([7, 8]);
    expect(image.contentType).toBe('image/png');
  });

  it('429 — provider_quota', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse({ error: 'quota' }, 429));
    const client = createGeminiImageClient({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(client.edit(INPUT)).rejects.toMatchObject({ reason: 'provider_quota' });
  });

  it('без ключа не ходить у мережу', async () => {
    const fetchImpl = jest.fn();
    const client = createGeminiImageClient({ apiKey: '', fetchImpl: fetchImpl as typeof fetch });

    await expect(client.edit(INPUT)).rejects.toBeInstanceOf(GeminiImageError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
