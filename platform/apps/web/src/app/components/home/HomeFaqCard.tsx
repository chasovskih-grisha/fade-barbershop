import { Badge } from '@fade/ui';
import { CATEGORY_LABEL, type FaqItem } from './home-faq-data';

interface HomeFaqCardProps {
  item: FaqItem;
  originalIdx: number;
  feedback?: 'yes' | 'no' | undefined;
  onFeedback: (idx: number, value: 'yes' | 'no') => void;
}

export function HomeFaqCard({ item, originalIdx, feedback, onFeedback }: HomeFaqCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface-raised border border-line p-6 shadow-sm hover:border-accent-blue/40 transition-all">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-h4 font-medium text-fg">{item.q}</h3>
        <Badge tone="neutral">{CATEGORY_LABEL[item.category]}</Badge>
      </div>
      <p className="text-body text-fg-secondary">{item.a}</p>
      <div className="mt-3 pt-3 border-t border-line/50 flex items-center justify-between text-xs text-fg-secondary">
        <span>Чи допомогла ця відповідь?</span>
        {feedback ? (
          <span className="text-accent font-medium">Дякуємо за відгук! ✦</span>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onFeedback(originalIdx, 'yes')}
              className="px-2.5 py-1 rounded-input bg-surface-base border border-line hover:border-accent text-fg transition-all"
            >
              👍 Так
            </button>
            <button
              onClick={() => onFeedback(originalIdx, 'no')}
              className="px-2.5 py-1 rounded-input bg-surface-base border border-line hover:border-accent text-fg transition-all"
            >
              👎 Ні
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
