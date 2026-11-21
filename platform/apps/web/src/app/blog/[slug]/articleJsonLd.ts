import type { Article } from '@fade/contracts';

/** Builds the BlogPosting + BreadcrumbList JSON-LD block for an article page. */
export function buildArticleJsonLd(article: Article, slug: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.excerpt || article.title,
        ...(article.coverUrl ? { image: article.coverUrl } : {}),
        datePublished: article.publishedAt,
        author: {
          '@type': 'Person',
          name: article.authorName || 'Fade Team',
        },
        publisher: {
          '@type': 'Organization',
          name: 'FADE Barbershop',
          url: siteUrl,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${siteUrl}/blog/${slug}`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Головна',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Блог',
            item: `${siteUrl}/blog`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: article.title,
            item: `${siteUrl}/blog/${slug}`,
          },
        ],
      },
    ],
  };
}
