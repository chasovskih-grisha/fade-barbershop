import type { Article, UpdateArticleInput } from '@fade/contracts';
import { parseTags } from './article-fields';

export interface Draft {
  title: string;
  excerpt: string;
  body: string;
  tags: string;
}

export function draftOf(article: Article): Draft {
  return {
    title: article.title,
    excerpt: article.excerpt ?? '',
    body: article.body,
    tags: article.tags.join(', '),
  };
}

export function inputOf(draft: Draft): UpdateArticleInput {
  return {
    title: draft.title,
    excerpt: draft.excerpt || null,
    body: draft.body,
    tags: parseTags(draft.tags),
  };
}
