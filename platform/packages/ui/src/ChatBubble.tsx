import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type ChatAuthor = 'client' | 'staff' | 'system';

export interface ChatBubbleProps extends HTMLAttributes<HTMLDivElement> {
  author: ChatAuthor;
  text: string;
  time?: string;
  className?: string;
}

const ALIGN: Record<ChatAuthor, string> = {
  client: 'self-end rounded-card bg-accent text-accent-fg',
  staff: 'self-start rounded-card bg-surface-raised text-fg',
  system: 'self-center rounded-pill bg-interactive text-caption text-fg-muted',
};

const AUTHOR_LABELS: Record<ChatAuthor, string> = {
  client: 'Повідомлення клієнта',
  staff: 'Повідомлення майстра',
  system: 'Системне повідомлення',
};

export function ChatBubble({ author, text, time, className, ...rest }: ChatBubbleProps) {
  return (
    <div
      role="article"
      aria-label={AUTHOR_LABELS[author]}
      className={cn('flex max-w-[80%] flex-col gap-0.5 px-3 py-2', ALIGN[author], className)}
      {...rest}
    >
      <p className="text-body">{text}</p>
      {time ? <span className="text-caption opacity-70">{time}</span> : null}
    </div>
  );
}
