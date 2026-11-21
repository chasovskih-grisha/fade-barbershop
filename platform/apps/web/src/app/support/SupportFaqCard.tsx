'use client';

import { Card, Badge } from '@fade/ui';
import type { FaqItem } from './support-data';

interface SupportFaqCardProps {
  faq: FaqItem;
  voted: boolean;
  onVote: (vote: 'yes' | 'no') => void;
}

export function SupportFaqCard({ faq, voted, onVote }: SupportFaqCardProps) {
  return (
    <Card className="p-5 bg-surface-base border border-line space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-text-primary text-base">{faq.question}</h4>
        <Badge tone="neutral" className="text-[10px] uppercase">
          {faq.category}
        </Badge>
      </div>
      <p className="text-sm text-text-muted leading-relaxed">{faq.answer}</p>
      <div className="pt-2 flex items-center justify-between text-xs text-text-muted border-t border-line/50">
        <span>Чи була ця відповідь корисною?</span>
        {voted ? (
          <span className="text-success font-medium">Дякуємо за відгук!</span>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onVote('yes')}
              className="px-2 py-1 rounded bg-surface-sunken hover:bg-surface-base border border-line text-text-primary transition-colors"
            >
              👍 Так
            </button>
            <button
              type="button"
              onClick={() => onVote('no')}
              className="px-2 py-1 rounded bg-surface-sunken hover:bg-surface-base border border-line text-text-primary transition-colors"
            >
              👎 Ні
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
