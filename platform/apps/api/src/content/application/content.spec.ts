import {
  ArticleSlugTakenError,
  ArticleNotFoundError,
  InvalidArticleInputError,
} from './content-errors';
import { articleFixture } from './content.fakes';
import { contentSetup, draftInput as draft } from './content-spec-setup';

// Сценарії MNG-ADM-17: чернетка → публікація → сайт; зняття → недоступно.
// Команди мовою домену (draft/publish/unpublish), стани — події в outbox.

describe('чернетка статті (DraftArticle)', () => {
  it('створює чернетку з нормалізованим slug і тегами, пише подію', async () => {
    const { drafting, articles, outbox } = contentSetup();
    const { id, slug } = await drafting.handle(draft);
    expect(slug).toBe('стрижка-по-київськи');
    const article = await articles.findById(id);
    expect(article?.status).toBe('draft');
    expect(article?.isPublished).toBe(false);
    expect(article?.tags).toEqual(['поради', 'стиль']);
    expect(outbox.types()).toEqual(['content.article.drafted']);
  });

  it('дубль slug → ArticleSlugTakenError (URL має бути унікальним)', async () => {
    const { drafting } = contentSetup();
    await drafting.handle(draft);
    await expect(drafting.handle({ ...draft, title: 'Інша' })).rejects.toBeInstanceOf(
      ArticleSlugTakenError
    );
  });

  it('порожній заголовок/текст → InvalidArticleInputError', async () => {
    const { drafting } = contentSetup();
    await expect(drafting.handle({ ...draft, title: '   ' })).rejects.toBeInstanceOf(
      InvalidArticleInputError
    );
    await expect(drafting.handle({ ...draft, body: '' })).rejects.toBeInstanceOf(
      InvalidArticleInputError
    );
  });
});

describe('публікація (PublishArticle)', () => {
  it('після публікації стаття з’являється у публічній стрічці, до — ні', async () => {
    const { drafting, publishing, publicList } = contentSetup();
    const { id } = await drafting.handle(draft);
    expect(await publicList.handle()).toHaveLength(0);

    await publishing.handle(id);
    const published = await publicList.handle();
    expect(published.map((article) => article.slug)).toEqual(['стрижка-по-київськи']);
    expect(published[0]?.publishedAt).toEqual(new Date('2026-09-20T09:00:00Z'));
  });

  it('подія публікації несе slug і дату (реле оновлює стрічку в додатку)', async () => {
    const { drafting, publishing, outbox } = contentSetup();
    const { id } = await drafting.handle(draft);
    await publishing.handle(id);
    const event = outbox.events.at(-1);
    expect(event?.type).toBe('content.article.published');
    expect(event?.payload).toMatchObject({ slug: 'стрижка-по-київськи' });
  });

  it('невідома стаття → ArticleNotFoundError', async () => {
    const { publishing } = contentSetup();
    await expect(publishing.handle('art-404')).rejects.toBeInstanceOf(ArticleNotFoundError);
  });

  it('стаття без тексту публікується? ні — InvalidArticleInputError з причиною', async () => {
    // Інваріант тримає сам агрегат; use case перетворює доменну помилку на
    // помилку застосунку, щоб CMS показала підказку, а не 500.
    const { articles, publishing } = contentSetup();
    articles.seed(articleFixture({ body: '' }));
    await expect(publishing.handle('art-1')).rejects.toBeInstanceOf(InvalidArticleInputError);
    await expect(publishing.handle('art-1')).rejects.toThrow(/body is required/i);
  });

  it('тіло із сирим HTML не публікується (T-2300a: лише підмножина markdown)', async () => {
    const { articles, publishing } = contentSetup();
    articles.seed(articleFixture({ body: '<script>alert(1)</script>' }));
    await expect(publishing.handle('art-1')).rejects.toBeInstanceOf(InvalidArticleInputError);
  });
});

describe('зняття з публікації (UnpublishArticle)', () => {
  it('стаття лишається в адмінці, але зникає з публічного API', async () => {
    const { drafting, publishing, unpublishing, adminList, publicGet } = contentSetup();
    const { id, slug } = await drafting.handle(draft);
    await publishing.handle(id);
    await unpublishing.handle(id);

    expect(await adminList.handle()).toHaveLength(1);
    await expect(publicGet.handle(slug)).rejects.toBeInstanceOf(ArticleNotFoundError);
  });
});
