import Link from 'next/link';
import { getPublishedArticles } from '@/lib/api/articles';
import { pageMetadata } from '@/lib/metadata';
import { ErrorState } from '@/app/components/states/ErrorState';
import { ActionLink } from '@/app/components/ActionLink';

// Стричка блогу — /blog (web-screens §3). Стан API: помилка → AlertBanner з
// повтором (сторінка лишається живою), немає статей → запрошення в
// адмінку-контент, публікацій → картки з анонсом, датою й тегами.

export const metadata = pageMetadata({
  title: 'Блог про зачіски, стиль і догляд — Fade',
  description: 'Статті барберів Fade: техніки стрижки, догляд за волоссям, історії та поради.',
  path: '/blog',
});

export default async function BlogPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
      <header className="flex flex-col gap-6 border-b border-line pb-12 relative overflow-hidden rounded-[var(--radius-card)] fade-card-gradient p-8 md:p-14 shadow-xl border-line-strong/60">
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-accent-blue/15 rounded-full blur-3xl pointer-events-none" />
        <Link href="/" className="text-body text-fg-secondary hover:text-fg w-fit transition-colors flex items-center gap-2 relative z-10">
          &larr; На головну
        </Link>
        <div className="inline-flex items-center gap-2 rounded-pill bg-accent-blue/15 border border-accent-blue/30 px-4.5 py-2 text-caption font-semibold uppercase text-accent-blue tracking-wider w-fit shadow-sm relative z-10">
          ✦ Журнал про чоловічий стиль, догляд та естетику
        </div>
        <h1 className="font-display text-[2.75rem] md:text-[3.5rem] font-bold text-fg leading-none relative z-10">
          Блог та експертні матеріали
        </h1>
        <p className="max-w-3xl text-bodyLg text-fg-secondary relative z-10">
          Історії, техніки стрижок, поради професійних барберів Fade та гайди з догляду за бородою і волоссям. Знання, що допомагають виглядати неперевершено щодня.
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
            <span className="text-bodyLg font-display font-bold text-fg">Бажаєте втілити поради на практиці?</span>
            <span className="text-body text-fg-secondary">Запишіться до топ-барберів Fade та отримайте персональну консультацію щодо догляду за вашим волоссям.</span>
          </div>
          <ActionLink
            href="/booking"
            className="inline-flex h-13 items-center justify-center rounded-input bg-accent px-8 text-body font-semibold text-accent-fg hover:opacity-95 w-fit shrink-0 transition-all shadow-lg hover:scale-[1.02]"
          >
            Записатися на стрижку &rarr;
          </ActionLink>
        </div>
      </header>

      {articles.state === 'error' && <ErrorState message={articles.message} />}
      {articles.state === 'empty' && (
        <p className="rounded-card border border-line p-8 text-body text-fg-secondary bg-surface text-center shadow-md">
          Поки що немає опублікованих статей. Загляньте пізніше — або запишіться на стрижку, поки що вільні вікна є.
        </p>
      )}
      {articles.state === 'ok' && (
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2" role="feed" aria-label="Список статей блогу">
          {articles.data.map((article) => (
            <li
              key={article.id}
              className="flex flex-col justify-between rounded-card border border-line-strong/60 bg-surface p-8 transition-all duration-300 hover:border-accent hover:shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-accent-blue/15 blur-2xl group-hover:bg-accent-blue/25 transition-all pointer-events-none" />
              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption font-semibold text-accent-blue uppercase tracking-wider">✦ Експертна стаття</span>
                  <span className="text-caption text-fg-muted font-medium">
                    {article.publishedAt && new Date(article.publishedAt).toLocaleDateString('uk-UA')}
                    {article.authorName ? ` · ${article.authorName}` : ''}
                  </span>
                </div>
                <h2 className="font-display text-h4 font-bold text-fg group-hover:text-accent transition-colors">
                  <Link href={`/blog/${article.slug}`} className="hover:underline">
                    {article.title}
                  </Link>
                </h2>
                {article.excerpt && <p className="text-body text-fg-secondary leading-relaxed">{article.excerpt}</p>}
                {article.tags.length > 0 && (
                  <ul className="flex flex-wrap gap-2 pt-2">
                    {article.tags.map((tag) => (
                      <li key={tag} className="rounded-pill bg-surface-sunken border border-line px-3 py-1 text-caption text-fg-secondary font-medium">
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-8 pt-5 border-t border-line relative z-10 flex items-center justify-between">
                <ActionLink href={`/blog/${article.slug}`} variant="secondary" className="h-11 px-6 text-body font-medium">
                  Читати статтю &rarr;
                </ActionLink>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

