// Спільні двійники для тестів RSS (T-2300c): стаття з блоками і мінімальний
// Response — jsdom його не має, а route handler віддає Web API.

export const rssArticle = {
  id: 'a1',
  slug: 'strizhka',
  title: 'Стрижка & догляд',
  excerpt: 'Коротко.',
  body: '',
  coverUrl: null,
  authorName: 'Fade',
  tags: ['стиль'],
  status: 'published' as const,
  publishedAt: '2026-09-20T09:00:00Z',
  createdAt: '2026-09-20T09:00:00Z',
  updatedAt: '2026-09-21T09:00:00Z',
  blocks: [
    { type: 'paragraph' as const, text: '<script>alert(1)</script>' },
    { type: 'heading' as const, level: 2 as const, text: 'Стиль' },
    { type: 'list' as const, items: ['раз', 'два'] },
  ],
};

export class FakeResponse {
  status = 200;
  readonly headers: { get: (key: string) => string | null };

  constructor(private readonly body: string, init: { headers?: Record<string, string> } = {}) {
    const map = init.headers ?? {};
    this.headers = { get: (key) => map[key] ?? null };
  }

  text(): Promise<string> {
    return Promise.resolve(this.body);
  }
}
