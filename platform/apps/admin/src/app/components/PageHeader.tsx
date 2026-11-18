'use client';

// Спільний заголовок адмін-сторінок: h1 + підзаголовок + дії праворуч.
// Один патерн = передбачувана розкладка на всіх екранах (design-system.md).
import type { ReactNode } from 'react';

export default function PageHeader({
  title,
  subtitle,
  description,
  actions,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
}) {
  const displaySubtitle = subtitle || description;
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-h3">{title}</h1>
        {displaySubtitle && <p className="mt-1 text-body text-fg-muted">{displaySubtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
