'use client';

import { useEffect, useRef } from 'react';
import { publicPageAnalytics } from '@/lib/analytics';

// Один перегляд статті — одна подія article_view (T-2300h). Тіло, заголовок і
// автор не їдуть: лише slug і перший тег. 404/превʼю не рендерять цей вузол.
export function ArticleViewTracker({ slug, tag }: { slug: string; tag?: string | undefined }) {
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (firedFor.current === slug) return;
    firedFor.current = slug;
    publicPageAnalytics.articleView(slug, tag);
  }, [slug, tag]);

  return null;
}
