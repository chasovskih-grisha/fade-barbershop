import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { cn } from './cn';
import { useDialogBehavior } from './useDialogBehavior';
import { useDialogMotion } from './useDialogMotion';

export type DialogPlacement = 'center' | 'bottom';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string | undefined;
  footer?: ReactNode | undefined;
  placement?: DialogPlacement | undefined;
  motionDurationMs?: number;
  className?: string | undefined;
  testIdOverlay?: string | undefined;
  testIdPanel?: string | undefined;
  /** Кнопка закриття в шапці; Sheet вимикає її для drawer-варіанта. */
  showCloseButton?: boolean | undefined;
  children: ReactNode;
}

const DEFAULT_MOTION_MS = 200;

export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  placement = 'center',
  motionDurationMs = DEFAULT_MOTION_MS,
  className,
  children,
  showCloseButton = true,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  // T-4510c: анімація входу поважає prefers-reduced-motion (WCAG 2.3.3).
  const { overlayStyle, panelStyle } = useDialogMotion(open, motionDurationMs);
  useDialogBehavior(open, onClose, panelRef);

  if (!open) return null;
  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex p-4',
        placement === 'bottom' ? 'items-end' : 'items-center justify-center'
      )}
      style={{ contain: 'layout' }}
    >
      <div
        data-testid="dialog-overlay"
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink/60"
        style={overlayStyle}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        data-testid="dialog-panel"
        style={panelStyle}
        className={cn(
          'relative flex w-full flex-col bg-surface-raised text-fg',
          placement === 'bottom' ? 'max-h-[85vh] rounded-t-card' : 'max-w-md rounded-card',
          className
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line p-4">
          <h2 id={titleId} className="font-display text-h4">
            {title}
          </h2>
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрити"
              className="rounded-micro p-1 text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            >
              ×
            </button>
          ) : null}
        </header>
        {description ? (
          <p id={descriptionId} className="px-4 pt-3 text-body text-fg-muted">
            {description}
          </p>
        ) : null}
        <div className="overflow-y-auto p-4">{children}</div>
        {footer ? (
          <footer className="flex justify-end gap-2 border-t border-line p-4">{footer}</footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
