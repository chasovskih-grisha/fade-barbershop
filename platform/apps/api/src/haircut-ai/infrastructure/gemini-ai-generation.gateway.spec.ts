import { InMemoryStorage } from '../application/fakes';
import type { AiGenerationPoll } from '../domain/ports';
import { GeminiImageError } from './gemini-image.error';
import { GeminiAiGenerationGateway } from './gemini-ai-generation.gateway';
import type { GeminiImageClient } from './gemini-image.client';

const PNG = new Uint8Array([1, 2, 3]);

function client(edit: GeminiImageClient['edit']): GeminiImageClient {
  return { edit };
}

async function untilSettled(
  gateway: GeminiAiGenerationGateway,
  handle: string
): Promise<AiGenerationPoll> {
  for (let i = 0; i < 20; i += 1) {
    const poll = await gateway.poll(handle);
    if (poll.state !== 'processing') return poll;
    await new Promise((resolve) => setImmediate(resolve));
  }
  throw new Error('generation did not settle');
}

describe('GeminiAiGenerationGateway', () => {
  it('кладе варіанти в наше сховище і віддає ready', async () => {
    const storage = new InMemoryStorage();
    const source = await storage.put({
      bytes: new Uint8Array([9]),
      contentType: 'image/jpeg',
      ownerId: 'user',
    });
    const edit = jest.fn(async () => ({ bytes: PNG, contentType: 'image/png' }));
    const gateway = new GeminiAiGenerationGateway(storage, client(edit));

    const { jobHandle } = await gateway.submit({
      suggestionId: 's1',
      sourcePhoto: { objectKey: source.objectKey, contentType: 'image/jpeg' },
      variantCount: 3,
    });
    const poll = await untilSettled(gateway, jobHandle);

    expect(edit).toHaveBeenCalledTimes(3);
    expect(poll.state).toBe('ready');
    if (poll.state === 'ready') {
      expect(poll.variants).toHaveLength(3);
      expect(poll.variants[0]?.contentType).toBe('image/png');
    }
  });

  it('немає фото — invalid_photo, провайдер не кличеться', async () => {
    const edit = jest.fn();
    const gateway = new GeminiAiGenerationGateway(new InMemoryStorage(), client(edit));
    const { jobHandle } = await gateway.submit({
      suggestionId: 's1',
      sourcePhoto: { objectKey: 'missing', contentType: 'image/jpeg' },
      variantCount: 3,
    });

    expect(await untilSettled(gateway, jobHandle)).toEqual({
      state: 'failed',
      reason: 'invalid_photo',
      message: 'Source photo is missing',
    });
    expect(edit).not.toHaveBeenCalled();
  });

  it('квота Gemini стає provider_quota', async () => {
    const storage = new InMemoryStorage();
    const source = await storage.put({
      bytes: new Uint8Array([9]),
      contentType: 'image/jpeg',
      ownerId: 'user',
    });
    const gateway = new GeminiAiGenerationGateway(
      storage,
      client(async () => {
        throw new GeminiImageError('provider_quota', 'Gemini quota exceeded');
      })
    );
    const { jobHandle } = await gateway.submit({
      suggestionId: 's1',
      sourcePhoto: { objectKey: source.objectKey, contentType: 'image/jpeg' },
      variantCount: 3,
    });

    expect(await untilSettled(gateway, jobHandle)).toMatchObject({
      state: 'failed',
      reason: 'provider_quota',
    });
  });
});
