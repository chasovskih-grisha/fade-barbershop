import { ArticleNotFoundError, ArticleSlugTakenError } from './content-errors';
import { articleFixture } from './content.fakes';
import { contentSetup, draftInput as draft } from './content-spec-setup';

describe('редагування (UpdateArticle)', () => {
  it('правка опублікованої статті не знімає її з публікації', async () => {
    const { drafting, publishing, updating, articles, publicGet } = contentSetup();
    const { id, slug } = await drafting.handle(draft);
    await publishing.handle(id);

    await updating.handle(id, { title: 'Стрижка по-київськи: 2026' });
    const article = await articles.findById(id);
    expect(article?.isPublished).toBe(true);
    expect((await publicGet.handle(slug)).title).toBe('Стрижка по-київськи: 2026');
  });

  it('новий slug конфліктує з іншою статтею → ArticleSlugTakenError', async () => {
    const { drafting, updating } = contentSetup();
    const { id } = await drafting.handle(draft);
    await drafting.handle({ ...draft, slug: 'druha-stattia', title: 'Друга' });
    await expect(updating.handle(id, { slug: 'druha-stattia' })).rejects.toBeInstanceOf(
      ArticleSlugTakenError
    );
  });

  it('неіснуюча стаття → ArticleNotFoundError', async () => {
    const { updating } = contentSetup();
    await expect(updating.handle('art-404', { title: 'X' })).rejects.toBeInstanceOf(
      ArticleNotFoundError
    );
  });

  it('явний null очищає анонс, а правка інших полів його не змінює', async () => {
    const { articles, updating } = contentSetup();
    articles.seed(articleFixture({ excerpt: 'Коротко' }));
    await updating.handle('art-1', { excerpt: null, authorName: 'Засновник' });
    let article = await articles.findById('art-1');
    expect(article?.excerpt).toBeNull();
    expect(article?.authorName).toBe('Засновник');

    await updating.handle('art-1', { title: 'Стрижка: оновлено' });
    article = await articles.findById('art-1');
    expect(article?.excerpt).toBeNull();
    expect(article?.authorName).toBe('Засновник');
  });

  it('правка тегів зберігає порядок і унікальність домену', async () => {
    const { articles, updating } = contentSetup();
    articles.seed(articleFixture({ tags: ['поради'] }));
    await updating.handle('art-1', { tags: ['Стиль', 'стиль', ' Стиль '] });
    expect((await articles.findById('art-1'))?.tags).toEqual(['стиль']);
  });
});

describe('зняття з публікації: помилки', () => {
  it('невідома стаття → ArticleNotFoundError', async () => {
    const { unpublishing } = contentSetup();
    await expect(unpublishing.handle('art-404')).rejects.toBeInstanceOf(ArticleNotFoundError);
  });
});
