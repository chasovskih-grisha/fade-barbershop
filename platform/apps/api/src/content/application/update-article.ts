// UpdateArticle — редагування статті (MNG-ADM-17). Зміни застосовуються і до
// опублікованої (редактор виправляє помилку в тексті на живому сайті) —
// публікація при цьому лишається, щоб не було «зникла стаття під час правки».

import { normalizeSlug, type Article } from '../domain/article';
import type { ArticleRepository, Clock, UnitOfWork } from '../domain/ports';
import { ArticleNotFoundError, ArticleSlugTakenError } from './content-errors';
import { assertDraft, type ArticleDraftInput } from './article-input';

export interface UpdateArticleInput {
  title?: string;
  slug?: string;
  body?: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  authorName?: string | null;
  tags?: string[];
}

async function resolveSlug(
  articles: ArticleRepository,
  article: Article,
  inputSlug: string | undefined
): Promise<string> {
  if (inputSlug === undefined) return article.slug;
  const slug = normalizeSlug(inputSlug);
  if (slug !== article.slug && (await articles.findBySlug(slug))) {
    throw new ArticleSlugTakenError();
  }
  return slug;
}

function mergedDraft(article: Article, input: UpdateArticleInput, slug: string): ArticleDraftInput {
  return {
    title: input.title ?? article.title,
    slug,
    body: input.body ?? article.body,
    excerpt: input.excerpt === undefined ? article.excerpt : input.excerpt,
    coverUrl: input.coverUrl === undefined ? article.coverUrl : input.coverUrl,
    authorName: input.authorName === undefined ? article.authorName : input.authorName,
    tags: input.tags ?? [...article.tags],
  };
}

export class UpdateArticleHandler {
  constructor(
    private readonly articles: ArticleRepository,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork
  ) {}

  async handle(id: string, input: UpdateArticleInput): Promise<{ id: string; slug: string }> {
    return this.uow.run(async () => {
      const article = await this.articles.findById(id);
      if (!article) throw new ArticleNotFoundError();

      const slug = await resolveSlug(this.articles, article, input.slug);
      // Повна валідація після злиття: не можуть лишитися порожні заголовок/текст
      // чи надто довгий анонс, навіть якщо прийшли лише частини полів.
      const values = assertDraft(mergedDraft(article, input, slug), slug);

      article.update(
        {
          title: values.title,
          slug: values.slug,
          body: values.body,
          excerpt: values.excerpt,
          coverUrl: values.coverUrl,
          authorName: values.authorName,
          tags: values.tags,
        },
        this.clock.now()
      );
      await this.articles.save(article);
      return { id: article.id, slug: article.slug };
    });
  }
}
