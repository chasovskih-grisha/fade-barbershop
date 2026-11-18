'use client';

import { useState } from 'react';
import { AlertBanner, Button } from '@fade/ui';
import type { Article, UpdateArticleInput } from '@fade/contracts';
import { statusLabel } from './article-fields';
import { draftOf, inputOf, type Draft } from './article-draft';

export default function ArticleEditor({
  article,
  onSave,
  onTogglePublish,
  busy,
  error,
}: {
  article: Article;
  onSave: (id: string, input: UpdateArticleInput) => Promise<void>;
  onTogglePublish: (article: Article) => Promise<void>;
  busy: boolean;
  error: string;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(article));
  const patch = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }));
  const dirty = JSON.stringify(inputOf(draft)) !== JSON.stringify(inputOf(draftOf(article)));
  const published = article.status === 'published';

  return (
    <article
      aria-label={article.title}
      className="flex flex-col gap-3 rounded-card border border-line p-4"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-h4">{article.slug}</h3>
        <span className="text-body">{statusLabel(article)}</span>
      </header>
      {error && (
        <AlertBanner tone="error" title="Стаття">
          {error}
        </AlertBanner>
      )}
      <label>
        Заголовок
        <input
          value={draft.title}
          maxLength={200}
          onChange={(event) => patch({ title: event.target.value })}
          className="mt-1 block w-full rounded-input border border-line p-2"
        />
      </label>
      <label>
        Анонс
        <textarea
          value={draft.excerpt}
          maxLength={500}
          onChange={(event) => patch({ excerpt: event.target.value })}
          className="mt-1 block w-full rounded-input border border-line p-2"
        />
      </label>
      <label>
        Текст статті
        <textarea
          value={draft.body}
          onChange={(event) => patch({ body: event.target.value })}
          className="mt-1 block min-h-40 w-full rounded-input border border-line p-2"
        />
      </label>
      <label>
        Теги через кому
        <input
          value={draft.tags}
          onChange={(event) => patch({ tags: event.target.value })}
          className="mt-1 block w-full rounded-input border border-line p-2"
        />
      </label>
      <footer className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="md"
          disabled={busy || !dirty}
          onClick={() => void onSave(article.id, inputOf(draft))}
        >
          Зберегти зміни
        </Button>
        <Button
          variant={published ? 'ghost' : 'primary'}
          size="md"
          disabled={busy}
          onClick={() => void onTogglePublish(article)}
        >
          {published ? 'Зняти з публікації' : 'Опублікувати'}
        </Button>
      </footer>
    </article>
  );
}
