import { useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from './cn';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = items.find((item) => item.id === value) ?? items[0];

  const move = (from: number, step: number) => {
    const count = items.length;
    let index = from;
    for (let attempt = 0; attempt < count; attempt += 1) {
      index = (index + step + count) % count;
      if (!items[index]?.disabled) break;
    }
    const target = items[index];
    /* istanbul ignore next -- недосяжно: move викликається лише коли є вкладки */
    if (!target) return;
    onChange(target.id);
    refs.current[index]?.focus();
  };

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight') move(index, 1);
    else if (event.key === 'ArrowLeft') move(index, -1);
    else if (event.key === 'Home') move(-1, 1);
    else if (event.key === 'End') move(0, -1);
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div role="tablist" className="flex gap-1 border-b border-line">
        {items.map((item, index) => {
          const selected = item.id === active?.id;
          return (
            <button
              key={item.id}
              ref={(element) => {
                refs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => onChange(item.id)}
              onKeyDown={handleKeyDown(index)}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-body font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
                'disabled:cursor-not-allowed disabled:opacity-50',
                selected
                  ? 'border-fg text-fg'
                  : 'border-transparent text-fg-muted hover:text-fg-secondary'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active ? (
        <div role="tabpanel" id={`panel-${active.id}`} aria-labelledby={`tab-${active.id}`}>
          {active.content}
        </div>
      ) : null}
    </div>
  );
}
