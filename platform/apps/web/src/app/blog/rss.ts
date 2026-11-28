import type { Article, ArticleBlock } from '@fade/contracts';

// RSS стрічка блогу (T-2300c): повний текст статті — це наші блоки, зроблені
// на сервері й екрановані, а не HTML із CMS. Чернетка у стрічку не потрапляє.

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

function blockToHtml(block: ArticleBlock): string {
  switch (block.type) {
    case 'heading':
      return `<h${block.level}>${escapeXml(block.text)}</h${block.level}>`;
    case 'list':
      return `<ul>${block.items.map((item) => `<li>${escapeXml(item)}</li>`).join('')}</ul>`;
    case 'quote':
      return `<blockquote>${escapeXml(block.text)}</blockquote>`;
    case 'image': {
      const caption = block.caption ? `<figcaption>${escapeXml(block.caption)}</figcaption>` : '';
      return `<figure><img src="${escapeXml(block.src)}" alt="${escapeXml(block.alt)}" />${caption}</figure>`;
    }
    default:
      return `<p>${escapeXml(block.text)}</p>`;
  }
}

export function blocksToHtml(blocks: ArticleBlock[] | undefined): string {
  return (blocks ?? []).map(blockToHtml).join('');
}

function itemXml(article: Article, base: string): string {
  const link = `${base}/blog/${article.slug}`;
  const parts = [
    `<title>${escapeXml(article.title)}</title>`,
    `<link>${escapeXml(link)}</link>`,
    `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
    article.publishedAt ? `<pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>` : '',
    // Контракт обіцяє blocks, але старіший API їх не віддає: стрічка лишається
    // валідною, а не падає на побудові (T-2300c, принцип «деградація, не 500»).
    `<description>${escapeXml(blocksToHtml(article.blocks ?? []))}</description>`,
    ...(article.tags ?? []).map((tag) => `<category>${escapeXml(tag)}</category>`),
  ];
  return `<item>${parts.filter(Boolean).join('')}</item>`;
}

export function buildRssFeed(articles: Article[], base: string): string {
  const published = articles.filter((article) => article.publishedAt !== null);
  const latest = published.reduce<string | null>(
    (max, article) => (!max || article.updatedAt > max ? article.updatedAt : max),
    null
  );
  const channel = [
    '<title>Блог Fade</title>',
    `<link>${escapeXml(`${base}/blog`)}</link>`,
    '<description>Стрижки, догляд і життя барбершопу FADE.</description>',
    '<language>uk</language>',
    latest ? `<lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>` : '',
    ...published.map((article) => itemXml(article, base)),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>${channel.filter(Boolean).join('')}</channel></rss>`;
}
