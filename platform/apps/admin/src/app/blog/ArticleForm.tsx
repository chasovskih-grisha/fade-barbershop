// Форма створення чернетки (MNG-ADM-17). URL генерується із заголовка, але
// лишається редагованим: URL статті не можна змінити після публікації без
// редиректу, тож зайвий раз змінити його не хочеться.

'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@fade/ui';
import type { DraftArticleInput } from '@fade/contracts';
import { parseTags, slugify } from './article-fields';

export { slugify } from './article-fields';

const FIELD = 'mt-1 block w-full rounded-input border border-line p-2';

export default function ArticleForm({
  onCreate,
  busy,
}: {
  onCreate: (input: DraftArticleInput) => Promise<void>;
  busy: boolean;
}) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onCreate({
      title,
      slug: slugTouched ? slug : slugify(title),
      body,
      excerpt: excerpt || null,
      tags: parseTags(tags),
    });
    setTitle('');
    setSlug('');
    setSlugTouched(false);
    setExcerpt('');
    setBody('');
    setTags('');
  }

  return (
    // prettier-ignore
    <form onSubmit={(event) => void submit(event)} aria-label="Нова стаття" className="flex flex-col gap-3 rounded-card border border-line p-4">
      <h2 className="font-display text-h4">Нова стаття</h2>
      <label>
        Заголовок
        <input
          required
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={FIELD}
        />
      </label>
      <label>
        URL (латиницею, через дефіс)
        <input
          required
          value={slugTouched ? slug : slugify(title)}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          className={FIELD}
        />
      </label>
      <label>
        Анонс
        <textarea
          value={excerpt}
          maxLength={500}
          onChange={(event) => setExcerpt(event.target.value)}
          className={FIELD}
        />
      </label>
      <label>
        Текст статті
        <textarea
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className={`${FIELD} min-h-40`}
        />
      </label>
      <label>
        Теги через кому
        <input value={tags} onChange={(event) => setTags(event.target.value)} className={FIELD} />
      </label>
      {/* prettier-ignore */}
      <Button type="submit" disabled={busy} size="md">{busy ? 'Зберігаємо…' : 'Зберегти чернетку'}</Button>
    </form>
  );
}
