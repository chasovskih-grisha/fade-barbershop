import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedArticle } from '@/lib/api/articles';
import { pageMetadata } from '@/lib/metadata';
import { ErrorState } from '@/app/components/states/ErrorState';
import { ArticleBody } from './ArticleBody';
import { ArticleBookCta } from './ArticleBookCta';
import { ArticleViewTracker } from './ArticleViewTracker';
import { buildArticleJsonLd } from './articleJsonLd';

// Сторінка статті — /blog/{slug} (web-screens §3, SEO: стаття має бути в
// пошуку). Чернетка для гостя = 404 (API такий slug не віддає), помилка API —
// жива сторінка з повтором, не мертва 404.

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublishedArticle(slug);
  if (result.state !== 'ok') {
    return pageMetadata({
      title: 'Статтю не знайдено',
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }
  const article = result.data;
  return pageMetadata({
    title: `${article.title} — блог Fade`,
    path: `/blog/${article.slug}`,
    // Анонс і обкладинка опційні: без них лишаються дефолтні SEO-поля.
    ...(article.excerpt ? { description: article.excerpt } : {}),
    ...(article.coverUrl ? { image: article.coverUrl } : {}),
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublishedArticle(slug);
  if (result.state === 'notFound') notFound();

  if (result.state === 'error') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <h1 className="font-display text-h2">Блог</h1>
        <ErrorState message={result.message} />
      </div>
    );
  }

  const article = result.data;
  const jsonLd = buildArticleJsonLd(article, slug);

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-10">
      <ArticleViewTracker slug={article.slug} tag={article.tags[0]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-h1">{article.title}</h1>
        <p className="text-body-s text-fg-secondary">
          {article.publishedAt && new Date(article.publishedAt).toLocaleDateString('uk-UA')}
          {article.authorName ? ` · ${article.authorName}` : ''}
        </p>
      </header>
      {article.coverUrl && (
        // Обкладинку задає редактор — хост довільний, тому без оптимізатора
        // Next (unoptimized): кадруємо байт-в-байт, а не гоняємо через /_next/image.
        <Image
          src={article.coverUrl}
          alt={article.title}
          width={1200}
          height={630}
          unoptimized
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAwIDYzMCI+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjMwIiBmaWxsPSIjMTMxNDE4Ii8+PC9zdmc+"
          className="h-auto w-full rounded-card object-cover"
        />
      )}
      <ArticleBody text={article.body} />
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        {article.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <li key={tag} className="rounded-input bg-interactive px-2 py-1 text-body-s">
                {tag}
              </li>
            ))}
          </ul>
        )}
        <Link href="/blog" className="text-body text-accent-blue hover:underline">
          ← Усі статті
        </Link>
        <ArticleBookCta />
      </footer>
    </article>
  );
}
