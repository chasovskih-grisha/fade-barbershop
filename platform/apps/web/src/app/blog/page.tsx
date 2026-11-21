import { getPublishedArticles } from '@/lib/api/articles';
import { ArticleCard } from './ArticleCard';
import { pageMetadata } from '@/lib/metadata';
import { ErrorState } from '@/app/components/states/ErrorState';
import { BlogHeader } from './BlogHeader';

// Стричка блогу — /blog (web-screens §3). Стан API: помилка → AlertBanner з
// повтором (сторінка лишається живою), немає статей → запрошення в
// адмінку-контент, публікацій → картки з анонсом, датою й тегами.

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = (await searchParams) ?? {};
  return pageMetadata({
    title: 'Блог про зачіски, стиль і догляд — Fade',
    description: 'Статті барберів Fade: техніки стрижки, догляд за волоссям, історії та поради.',
    path: '/blog',
    // Пошуковий запит — не сторінка для індексу (T-2300e).
    noIndex: Boolean(q?.trim()),
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = (await searchParams) ?? {};
  const query = q?.trim() ?? '';
  const articles = await getPublishedArticles(query ? { q: query } : {});

  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
      <BlogHeader />

      <form action="/blog" method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="blog-q" className="sr-only">
          Пошук статей
        </label>
        <input
          id="blog-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Пошук за заголовком, анонсом або текстом"
          className="h-12 w-full rounded-input border border-line bg-surface px-4 text-body text-fg placeholder:text-fg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        />
        <button
          type="submit"
          className="inline-flex h-12 min-w-11 items-center justify-center rounded-input bg-accent px-6 text-body font-semibold text-accent-fg hover:opacity-95"
        >
          Знайти
        </button>
      </form>

      {articles.state === 'error' && <ErrorState message={articles.message} />}
      {articles.state === 'empty' && (
        <p className="rounded-card border border-line p-8 text-body text-fg-secondary bg-surface text-center shadow-md">
          {query
            ? `За запитом «${query}» нічого не знайшлося. Спробуйте інше слово або поверніться до всіх статей.`
            : 'Поки що немає опублікованих статей. Загляньте пізніше — або запишіться на стрижку, поки що вільні вікна є.'}
        </p>
      )}
      {articles.state === 'ok' && (
        <ul
          className="grid grid-cols-1 gap-8 md:grid-cols-2"
          role="feed"
          aria-label="Список статей блогу"
        >
          {articles.data.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </ul>
      )}
    </div>
  );
}
