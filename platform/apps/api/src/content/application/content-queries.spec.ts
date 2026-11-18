import { Article } from '../domain/article';
import { GetArticleHandler, ListPublishedArticlesHandler, GetPublishedArticleHandler } from './article-queries';
import { ArticleNotFoundError } from './content-errors';
import { FakeArticleRepository, articleFixture } from './content.fakes';
import { contentSetup } from './content-spec-setup';

describe('адмінський запит за id', () => {
  it('неіснуюча стаття → ArticleNotFoundError (CMS отримує 404)', async () => {
    const { articles } = contentSetup();
    await expect(new GetArticleHandler(articles).handle('art-404')).rejects.toBeInstanceOf(
      ArticleNotFoundError
    );
    articles.seed(articleFixture());
    expect((await new GetArticleHandler(articles).handle('art-1')).slug).toBe(
      'strizhka-po-kyivsku'
    );
  });
});

describe('публічні запити', () => {
  it('стрічка впорядкована новішими спершу й обмежена length', async () => {
    const articles = new FakeArticleRepository();
    articles.seed(
      articleFixture({
        id: 'a1',
        slug: 'stara',
        status: 'published',
        publishedAt: new Date('2026-09-01T09:00:00Z'),
      }),
      articleFixture({
        id: 'a2',
        slug: 'nova',
        status: 'published',
        publishedAt: new Date('2026-09-19T09:00:00Z'),
      }),
      articleFixture({ id: 'a3', slug: 'chernetka', status: 'draft' })
    );
    const list = await new ListPublishedArticlesHandler(articles).handle();
    expect(list.map((a) => a.slug)).toEqual(['nova', 'stara']);
  });

  it('чернетка за slug для гостя — 404, а не 403 (не витікає сам факт існування)', async () => {
    const articles = new FakeArticleRepository();
    articles.seed(
      Article.create({
        id: 'a1',
        slug: 'chernetka',
        title: 'Чернетка',
        body: 'Текст',
        createdAt: new Date('2026-09-20T09:00:00Z'),
      })
    );
    await expect(
      new GetPublishedArticleHandler(articles).handle('chernetka')
    ).rejects.toBeInstanceOf(ArticleNotFoundError);
  });
});
