import Link from 'next/link';
import { getPublishedArticles } from '@/lib/api/articles';

// Тизер блогу на головній (web-screens §0, блок 7): 2–3 останні статті.
// Секція без даних ховається — публічна сторінка не показує пусток.

export async function BlogTeaser({ limit = 3 }: { limit?: number }) {
  const articles = await getPublishedArticles({ limit });
  if (articles.state !== 'ok' || articles.data.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-label="Останні статті блогу">
      <h2 className="font-display text-h3 text-fg">Блог</h2>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {articles.data.map((article) => (
          <li key={article.id} className="flex flex-col gap-2 rounded-card border border-line p-4">
            <h3 className="text-bodyLg font-semibold text-fg">
              <Link href={`/blog/${article.slug}`} className="hover:text-fg-secondary">
                {article.title}
              </Link>
            </h3>
            {article.excerpt && <p className="text-body text-fg-secondary">{article.excerpt}</p>}
            {article.publishedAt && (
              <p className="text-body-s text-fg-secondary">
                {new Date(article.publishedAt).toLocaleDateString('uk-UA')}
              </p>
            )}
          </li>
        ))}
      </ul>
      <Link href="/blog" className="w-fit text-body text-accent-blue hover:underline">
        Усі статті
      </Link>
    </section>
  );
}
