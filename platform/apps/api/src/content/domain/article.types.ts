// Типи агрегату Article (окремо від класу — гейт max-lines, як client-profile.types).
export type ArticleStatus = 'draft' | 'published';

export interface ArticleProps {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  authorName: string | null;
  tags: string[];
  status: ArticleStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
