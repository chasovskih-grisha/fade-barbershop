'use client';

// Список правил surge (T-4811): чинні множники й кнопка «Змінити» на кожному.
// Порожній список — не порожній блок: він каже, що ціна поки базова.
import { Badge, Button } from '@fade/ui';
import { multiplierLabel, ruleScope } from './surge-rule-view';
import type { SurgeRuleRow } from './surge-rule-draft';
import type { LocationOption } from './use-surge-rules';

export default function SurgeRuleList({
  rules,
  locations,
  onEdit,
}: {
  rules: SurgeRuleRow[];
  locations: LocationOption[];
  onEdit: (rule: SurgeRuleRow) => void;
}) {
  const placeName = (locationId: string | null): string =>
    locationId === null
      ? 'Вся мережа'
      : (locations.find((place) => place.id === locationId)?.name ?? 'Локація');

  if (rules.length === 0) {
    return (
      <p className="rounded-card border border-line bg-surface-base px-4 py-3 text-body text-fg-secondary">
        Правил немає — усі слоти йдуть за базовою ціною.
      </p>
    );
  }

  return (
    <ul aria-label="Правила surge" className="flex flex-col gap-2">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-input border border-line bg-surface-base px-4 py-3"
        >
          <span className="flex min-w-0 flex-col">
            <span className="text-body font-medium text-fg">
              {placeName(rule.locationId)} · {ruleScope(rule)}
            </span>
            <span className="text-caption text-fg-muted">
              Множник {multiplierLabel(rule.multiplierBp)}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <Badge tone={rule.active ? 'success' : 'neutral'}>
              {rule.active ? 'Активне' : 'Вимкнене'}
            </Badge>
            <Button variant="secondary" size="sm" onClick={() => onEdit(rule)}>
              Змінити
            </Button>
          </span>
        </li>
      ))}
    </ul>
  );
}
