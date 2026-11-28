import { BLOG_REVALIDATE_SEC, getPublishedArticle, getPublishedArticles } from '@/lib/api/articles';
import type { Article } from '@fade/contracts';
import { buildRssFeed } from '../rss';

// /blog/rss.xml (T-2300c): тільки опубліковані статті. Помилка API на списку
// дає порожній, але валідний канал — стрічка не має віддавати 500 читачам.

// Next читає segment config статично: літерал, не імпортована константа.
// Значення мусить дорівнювати BLOG_REVALIDATE_SEC (src/lib/api/articles.ts).
export const revalidate = 300;

const RSS_LIMIT = 20;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';

export async function GET(): Promise<Response> {
  const list = await getPublishedArticles({ limit: RSS_LIMIT });
  const summaries = list.state === 'ok' ? list.data : [];
  const results = await Promise.all(summaries.map((summary) => getPublishedArticle(summary.slug)));
  const articles = results.flatMap<Article>((result) =>
    result.state === 'ok' ? [result.data] : []
  );

  return new Response(buildRssFeed(articles, siteUrl), {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': `public, max-age=0, s-maxage=${BLOG_REVALIDATE_SEC}`,
    },
  });
}
