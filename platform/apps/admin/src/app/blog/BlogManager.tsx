// CMS блогу: список статей (чернетки й опубліковані), створення, редагування,
// публікація/зняття. Сценарій MNG-ADM-17. Список і фільтр — ArticleListView.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertBanner } from '@fade/ui';
import type { Article, DraftArticleInput, UpdateArticleInput } from '@fade/contracts';
import PageHeader from '../components/PageHeader';
import { blogApi } from './blog-api';
import ArticleForm from './ArticleForm';
import { ArticleListView } from './ArticleListView';

export default function BlogManager() {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('all');

  const reload = useCallback(async () => {
    try {
      setArticles(await blogApi.list());
    } catch {
      setError('Не вдалося завантажити статті. Спробуйте ще раз');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function run<T>(work: () => Promise<T>): Promise<void> {
    setBusy(true);
    setError('');
    try {
      await work();
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося виконати дію');
    } finally {
      setBusy(false);
    }
  }

  const create = (input: DraftArticleInput) => run(() => blogApi.create(input));
  const save = (id: string, input: UpdateArticleInput) => run(() => blogApi.update(id, input));
  const togglePublish = (article: Article) =>
    run(() =>
      article.status === 'published' ? blogApi.unpublish(article.id) : blogApi.publish(article.id)
    );

  return (
    <main className="flex flex-col gap-4">
      <PageHeader
        title="Блог"
        subtitle="Чернетки та публікації сайту; публічна стаття з’являється одразу"
      />
      {error && (
        <AlertBanner
          tone="error"
          title="Блог"
          action={{ label: 'Спробувати ще раз', onClick: () => void reload() }}
        >
          {error}
        </AlertBanner>
      )}
      <ArticleForm onCreate={create} busy={busy} />
      {articles === null ? (
        <p role="status" className="text-body">
          Завантажуємо статті…
        </p>
      ) : articles.length === 0 ? (
        <p className="text-body">
          Статей ще немає. Створіть першу чернетку — вона з’явиться на сайті лише після публікації.
        </p>
      ) : (
        <ArticleListView
          articles={articles}
          status={status}
          onStatusChange={setStatus}
          onSave={save}
          onTogglePublish={togglePublish}
          busy={busy}
        />
      )}
    </main>
  );
}
