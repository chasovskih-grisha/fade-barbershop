import Link from 'next/link';
import { getPublishedArticles } from '@/lib/api/articles';
import { ArticleCard } from './ArticleCard';
import { pageMetadata } from '@/lib/metadata';
import { ErrorState } from '@/app/components/states/ErrorState';
import { ActionLink } from '@/app/components/ActionLink';

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
      <header className="flex flex-col gap-6 border-b border-line pb-12 relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient p-8 md:p-14 shadow-xl border-line-strong/60">
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none" />
        <Link
          href="/"
          className="text-body text-fg-secondary hover:text-fg w-fit transition-colors flex items-center gap-2 relative z-10"
        >
          &larr; На головну
        </Link>
        <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4.5 py-2 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit shadow-sm relative z-10">
          ✦ Журнал про чоловічий стиль, догляд та естетику
        </div>
        <h1 className="font-display text-[2.75rem] md:text-[3.5rem] font-bold text-fg leading-none relative z-10">
          Блог та експертні матеріали
        </h1>
        <p className="max-w-3xl text-bodyLg text-fg-secondary relative z-10">
          Історії, техніки стрижок, поради професійних барберів Fade та гайди з догляду за бородою і
          волоссям. Знання, що допомагають виглядати неперевершено щодня.
        </p>

        {/* Категорії статей */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 relative z-10">
          <span className="inline-flex items-center rounded-pill bg-accent text-accent-fg px-4 py-2 text-caption font-semibold shadow-sm">
            Усі публікації
          </span>
          <span className="inline-flex items-center rounded-pill bg-surface-sunken border border-line text-fg-secondary hover:text-fg px-4 py-2 text-caption font-medium transition-colors cursor-pointer">
            Тренди та стайлінг
          </span>
          <span className="inline-flex items-center rounded-pill bg-surface-sunken border border-line text-fg-secondary hover:text-fg px-4 py-2 text-caption font-medium transition-colors cursor-pointer">
            Догляд за бородою
          </span>
          <span className="inline-flex items-center rounded-pill bg-surface-sunken border border-line text-fg-secondary hover:text-fg px-4 py-2 text-caption font-medium transition-colors cursor-pointer">
            Поради експертів
          </span>
        </div>

        {/* Промо-баннер підписки або запису в блозі */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-card border-2 border-accent-blue/40 bg-surface-sunken p-8 shadow-xl backdrop-blur-md relative z-10">
          <div className="flex flex-col gap-2">
            <span className="text-bodyLg font-display font-bold text-fg">
              Бажаєте втілити поради на практиці?
            </span>
            <span className="text-body text-fg-secondary">
              Запишіться до топ-барберів Fade та отримайте персональну консультацію щодо догляду за
              вашим волоссям.
            </span>
          </div>
          <ActionLink
            href="/booking"
            className="inline-flex h-13 items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 w-fit shrink-0 transition-all shadow-lg hover:scale-[1.02]"
          >
            Записатися на стрижку &rarr;
          </ActionLink>
        </div>
      </header>

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
