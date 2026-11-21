import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedArticles } from '@/lib/api/articles';
import { pageMetadata } from '@/lib/metadata';
import { ErrorState } from '@/app/components/states/ErrorState';
import { ArticleCard } from '../../ArticleCard';

// Архів тегу — /blog/tag/{tag} (T-2300e). Тег без жодної опублікованої
// статті = 404, щоб порожні архіви не індексувалися; помилка API — жива
// сторінка з повтором.

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return pageMetadata({
    title: `${decoded} — блог Fade`,
    description: `Статті барберів Fade з тегом «${decoded}».`,
    path: `/blog/tag/${encodeURIComponent(decoded)}`,
  });
}

export default async function BlogTagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const articles = await getPublishedArticles({ tag: decoded });

  if (articles.state === 'notFound' || articles.state === 'empty') notFound();

  return (
    <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-16 md:py-24">
      <header className="flex flex-col gap-4 border-b border-line pb-8">
        <Link
          href="/blog"
          className="text-body text-fg-secondary hover:text-fg w-fit transition-colors"
        >
          &larr; Усі статті
        </Link>
        <h1 className="font-display text-h2 font-bold text-fg">{decoded}</h1>
        <p className="text-body text-fg-secondary">Статті з цим тегом.</p>
      </header>

      {articles.state === 'error' && <ErrorState message={articles.message} />}
      {articles.state === 'ok' && (
        <ul
          className="grid grid-cols-1 gap-8 md:grid-cols-2"
          role="feed"
          aria-label={`Статті з тегом ${decoded}`}
        >
          {articles.data.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </ul>
      )}
    </div>
  );
}
