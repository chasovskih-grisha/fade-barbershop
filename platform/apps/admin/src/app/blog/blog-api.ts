// Клієнт CMS блогу: усі запити йдуть на /admin/* з cookie (AdminSessionGuard на
// API). Типи — з @fade/contracts, щоб не дублювати DTO.

import type {
  Article,
  ArticleRef,
  DraftArticleInput,
  PublishArticleResult,
  UpdateArticleInput,
} from '@fade/contracts';

const json = { 'Content-Type': 'application/json' };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/admin/content${path}`, { credentials: 'include', ...init });
  if (!response.ok) throw new Error(await errorMessage(response));
  return (await response.json()) as T;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { code?: string };
    if (body.code === 'ARTICLE_SLUG_TAKEN') return 'Такий URL вже зайнятий іншою статтею';
    if (body.code === 'INVALID_ARTICLE_INPUT') return 'Перевірте заголовок, URL і текст статті';
  } catch {
    // відповідь без JSON — показуємо загальну підказку
  }
  return 'Не вдалося виконати дію. Спробуйте ще раз';
}

export const blogApi = {
  list: (): Promise<Article[]> => call<Article[]>('/articles'),
  get: (id: string): Promise<Article> => call<Article>(`/articles/${id}`),
  create: (input: DraftArticleInput): Promise<ArticleRef> =>
    call<ArticleRef>('/articles', { method: 'POST', headers: json, body: JSON.stringify(input) }),
  update: (id: string, input: UpdateArticleInput): Promise<ArticleRef> =>
    call<ArticleRef>(`/articles/${id}`, {
      method: 'PATCH',
      headers: json,
      body: JSON.stringify(input),
    }),
  publish: (id: string): Promise<PublishArticleResult> =>
    call<PublishArticleResult>(`/articles/${id}/publish`, { method: 'POST' }),
  unpublish: (id: string): Promise<ArticleRef> =>
    call<ArticleRef>(`/articles/${id}/unpublish`, { method: 'POST' }),
};
