export type ArticleChanges = {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  body?: string;
  coverUrl?: string | null;
  authorName?: string | null;
  tags?: string[];
};

export { applyArticleChanges } from './article-update-apply';
