import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fade.com.ua';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account/', '/booking/', '/login/', '/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
