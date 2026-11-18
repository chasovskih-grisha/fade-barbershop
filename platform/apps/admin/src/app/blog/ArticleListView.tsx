'use client';

// Список статей із фільтром статусу (усі/чернетки/опубліковані) — винесено з
// BlogManager за LOC-гейт (ADR 0019). Лічильник «Показано: N з M» — сценарій
// MNG-ADM-17; редагування й публікація кожної статті — в ArticleEditor.
import type { Article, UpdateArticleInput } from '@fade/contracts';
import { FilterSelect } from '../components/FilterSelect';
import ArticleEditor from './ArticleEditor';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Усі' },
  { value: 'draft', label: 'Чернетки' },
  { value: 'published', label: 'Опубліковані' },
];

export function ArticleListView({
  articles,
  status,
  onStatusChange,
  onSave,
  onTogglePublish,
  busy,
}: {
  articles: Article[];
  status: string;
  onStatusChange: (status: string) => void;
  onSave: (id: string, input: UpdateArticleInput) => Promise<void>;
  onTogglePublish: (article: Article) => Promise<void>;
  busy: boolean;
}) {
  const visible = articles.filter((article) => status === 'all' || article.status === status);

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <FilterSelect
          label="Статус"
          value={status}
          options={STATUS_OPTIONS}
          onChange={onStatusChange}
        />
        <p className="text-body text-fg-secondary">
          Показано: {visible.length} з {articles.length}
        </p>
      </div>
      {visible.length === 0 ? (
        <p className="text-body">Статей з таким статусом немає.</p>
      ) : (
        visible.map((article) => (
          <ArticleEditor
            key={article.id}
            article={article}
            onSave={onSave}
            onTogglePublish={onTogglePublish}
            busy={busy}
            error=""
          />
        ))
      )}
    </>
  );
}
