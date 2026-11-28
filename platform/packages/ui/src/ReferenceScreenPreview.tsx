import type { HTMLAttributes } from 'react';
import { cn } from './cn';
import { AdminShellPreview } from './reference-screens/AdminShellPreview';
import { MobileHomePreview } from './reference-screens/MobileHomePreview';
import { SlotFlowPreview } from './reference-screens/SlotFlowPreview';
import { WebHomePreview } from './reference-screens/WebHomePreview';

export type ReferenceScreenType = 'web-home' | 'admin-shell' | 'slot-flow' | 'mobile-home';

export interface ReferenceScreenPreviewProps extends HTMLAttributes<HTMLDivElement> {
  screenType: ReferenceScreenType;
}

const SCREENS = {
  'web-home': WebHomePreview,
  'admin-shell': AdminShellPreview,
  'slot-flow': SlotFlowPreview,
  'mobile-home': MobileHomePreview,
} as const;

const CAPTIONS: Record<ReferenceScreenType, string> = {
  'web-home': 'Web · головна',
  'admin-shell': 'Admin · каркас',
  'slot-flow': 'Web · крок часу',
  'mobile-home': 'Mobile · головна',
};

/**
 * Еталонний екран дизайн-системи: кожен `screenType` — справжня композиція
 * з примітивів @fade/ui на семантичних токенах, а не одна заглушка на всі.
 */
export function ReferenceScreenPreview({
  screenType,
  className,
  ...rest
}: ReferenceScreenPreviewProps) {
  const Screen = SCREENS[screenType];
  return (
    <div
      role="region"
      aria-label={`Reference screen: ${screenType}`}
      className={cn(
        'rounded-card border border-line bg-surface-base p-4 text-fg transition-colors',
        'sm:p-6 lg:p-8',
        className
      )}
      {...rest}
    >
      <p className="mb-4 text-caption uppercase tracking-wider text-fg-muted">
        {CAPTIONS[screenType]}
      </p>
      <Screen />
    </div>
  );
}
