// Адаптер підпису референсів (REF-ADM-01): підписує лише живі фото з TTL
// підписувача, схлопує дублікати ID, а відсутні й м'яко видалені не потрапляють
// у мапу — картка покаже «Фото недоступне», а не зламане зображення.
import { SIGNED_URL_TTL_SEC } from '../../haircut-ai/application/ai-read-model';
import { HaircutAiReferencePhotoUrls } from './reference-photo-urls.adapter';
import type { SourcePhoto } from '../../haircut-ai/domain/source-photo';

const photo = (id: string, deleted = false): SourcePhoto =>
  ({ id, objectKey: `key/${id}`, isDeleted: deleted }) as unknown as SourcePhoto;

function setup(found: Record<string, ReturnType<typeof photo> | null>) {
  const findByIds = jest.fn(async (ids: readonly string[]) => ids.map((id) => found[id] ?? null));
  const signedUrl = jest.fn(
    async (objectKey: string, ttl: number) => `https://signed/${ttl}/${objectKey}`
  );
  const adapter = new HaircutAiReferencePhotoUrls(
    { findByIds } as unknown as never,
    { signedUrl } as unknown as never
  );
  return { adapter, findByIds, signedUrl };
}

describe('HaircutAiReferencePhotoUrls', () => {
  it('підписує кожне живе фото один раз і схлопує дублікати ID', async () => {
    const { adapter, findByIds, signedUrl } = setup({ a: photo('a'), b: photo('b') });
    findByIds.mockResolvedValueOnce([photo('a'), photo('b')]);

    const urls = await adapter.sign(['a', 'b', 'a']);

    expect([...urls]).toEqual([
      ['a', `https://signed/${SIGNED_URL_TTL_SEC}/key/a`],
      ['b', `https://signed/${SIGNED_URL_TTL_SEC}/key/b`],
    ]);
    expect(signedUrl).toHaveBeenCalledTimes(2);
  });

  it('відсутнє й м’яко видалене фото не отримують URL і не підписуються', async () => {
    const { adapter, findByIds, signedUrl } = setup({ gone: photo('gone', true) });
    findByIds.mockResolvedValueOnce([]);

    const urls = await adapter.sign(['gone', 'missing']);

    expect(urls.size).toBe(0);
    expect(signedUrl).not.toHaveBeenCalled();
  });

  it('порожній список не торкається репозиторію', async () => {
    const { adapter, findByIds } = setup({});

    await expect(adapter.sign([])).resolves.toEqual(new Map());
    expect(findByIds).not.toHaveBeenCalled();
  });

  it('знайдені фото підписуються; прибраний репозиторій — ок', async () => {
    const live: SourcePhoto = {
      id: 'ok',
      objectKey: 'key/ok',
      isDeleted: false,
    } as unknown as SourcePhoto;
    const { adapter, findByIds, signedUrl } = setup({ ok: live });

    findByIds.mockResolvedValueOnce([live]);

    const urls = await adapter.sign(['ok', 'gone']);

    expect(urls.size).toBe(1);
    expect(urls.get('ok')).toBe(`https://signed/${SIGNED_URL_TTL_SEC}/key/ok`);
    expect(signedUrl).toHaveBeenCalledWith('key/ok', SIGNED_URL_TTL_SEC);
    expect(signedUrl).toHaveBeenCalledTimes(1);
  });
});
