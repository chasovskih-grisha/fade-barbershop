import Link from 'next/link';
import type { ArticleSummary } from '@fade/contracts';
import { ActionLink } from '@/app/components/ActionLink';

// Картка статті у стрічці /blog і в архіві тегу (T-2300b, T-2300e): одна
// розмітка на обидві сторінки, тег веде в архів, а не в нікуди.

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <li className="flex flex-col justify-between rounded-card border border-line-strong/60 bg-surface p-8 transition-all duration-300 hover:border-accent hover:shadow-2xl relative overflow-hidden group">
      <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-accent-blue/15 blur-2xl group-hover:bg-accent-blue/25 transition-all pointer-events-none" />
      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption font-semibold text-accent-blue uppercase tracking-wider">
            ✦ Експертна стаття
          </span>
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
        {article.excerpt && (
          <p className="text-body text-fg-secondary leading-relaxed">{article.excerpt}</p>
        )}
        {article.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 pt-2">
            {article.tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/blog/tag/${encodeURIComponent(tag)}`}
                  className="rounded-pill bg-surface-sunken border border-line px-3 py-1 text-caption text-fg-secondary font-medium hover:text-fg transition-colors"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-8 pt-5 border-t border-line relative z-10 flex items-center justify-between">
        <ActionLink
          href={`/blog/${article.slug}`}
          variant="secondary"
          className="h-11 px-6 text-body font-medium"
        >
          Читати статтю &rarr;
        </ActionLink>
      </div>
    </li>
  );
}
