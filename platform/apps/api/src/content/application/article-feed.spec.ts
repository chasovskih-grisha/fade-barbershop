import { ListPublishedArticlesHandler } from './article-queries';
import { clampLimit, encodeCursor, FEED_LIMIT, FEED_PAGE_MAX } from './article-feed';
import { FakeArticleRepository, articleFixture } from './content.fakes';

const published = (id: string, iso: string, overrides = {}) =>
  articleFixture({ id, slug: id, status: 'published', publishedAt: new Date(iso), ...overrides });

const feed = (repo: FakeArticleRepository) => new ListPublishedArticlesHandler(repo);

describe('пошук у стрічці (T-2300e)', () => {
  it('знаходить слово із заголовка, анонсу й тіла опублікованої статті', async () => {
    const repo = new FakeArticleRepository();
    repo.seed(
      published('a1', '2026-09-01T09:00:00Z', { title: 'Фейд на коротке волосся' }),
      published('a2', '2026-09-02T09:00:00Z', { excerpt: 'Догляд за бородою взимку' }),
      published('a3', '2026-09-03T09:00:00Z', { body: 'Барбер радить тримати форму.' })
    );
    expect((await feed(repo).handle({ q: 'бородою' })).map((a) => a.id)).toEqual(['a2']);
    expect((await feed(repo).handle({ q: 'фейд' })).map((a) => a.id)).toEqual(['a1']);
    expect((await feed(repo).handle({ q: 'форму' })).map((a) => a.id)).toEqual(['a3']);
  });

  it('слово лише з чернетки не знаходиться', async () => {
    const repo = new FakeArticleRepository();
    repo.seed(
      published('a1', '2026-09-01T09:00:00Z', { body: 'Публічний текст.' }),
      articleFixture({ id: 'a2', slug: 'a2', status: 'draft', body: 'Секретний абзац.' })
    );
    expect(await feed(repo).handle({ q: 'секретний' })).toEqual([]);
  });

  it('порожній запит — уся стрічка', async () => {
    const repo = new FakeArticleRepository();
    repo.seed(published('a1', '2026-09-01T09:00:00Z'), published('a2', '2026-09-02T09:00:00Z'));
    expect((await feed(repo).handle({ q: '   ' })).map((a) => a.id)).toEqual(['a2', 'a1']);
  });
});

describe('архів тегу (T-2300e)', () => {
  it('віддає статті з тегом без урахування регістру й не чіпає інші теги', async () => {
    const repo = new FakeArticleRepository();
    repo.seed(
      published('a1', '2026-09-01T09:00:00Z', { tags: ['Догляд'] }),
      published('a2', '2026-09-02T09:00:00Z', { tags: ['стиль'] })
    );
    expect((await feed(repo).handle({ tag: 'догляд' })).map((a) => a.id)).toEqual(['a1']);
    expect(await feed(repo).handle({ tag: 'невідомий' })).toEqual([]);
  });
});

describe('курсор стрічки (T-2300e)', () => {
  it('не дублює і не губить статтю з тією самою датою', async () => {
    const repo = new FakeArticleRepository();
    const sameDay = '2026-09-10T09:00:00Z';
    repo.seed(
      published('a3', sameDay),
      published('a2', sameDay),
      published('a1', '2026-09-01T09:00:00Z')
    );
    const first = await feed(repo).handle({ limit: 2 });
    expect(first.map((a) => a.id)).toEqual(['a3', 'a2']);
    const second = first[1];
    if (!second) throw new Error('expected second article');
    const next = await feed(repo).handle({ limit: 2, cursor: encodeCursor(second) });
    expect(next.map((a) => a.id)).toEqual(['a1']);
  });

  it('зіпсований курсор не приховує стрічку', async () => {
    const repo = new FakeArticleRepository();
    repo.seed(published('a1', '2026-09-01T09:00:00Z'));
    expect((await feed(repo).handle({ cursor: 'сміття' })).map((a) => a.id)).toEqual(['a1']);
  });
});

describe('межа сторінки (T-2300e)', () => {
  it('типово 20, стеля API 50, від’ємне значення — типовий розмір', () => {
    expect(clampLimit(undefined)).toBe(FEED_LIMIT);
    expect(clampLimit(500)).toBe(FEED_PAGE_MAX);
    expect(clampLimit(-3)).toBe(FEED_LIMIT);
  });
});
