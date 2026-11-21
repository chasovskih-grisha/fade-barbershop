import { Button } from '@fade/ui';
import { ruleBadge, type PricingRule } from './pricing-rules-data';

export default function PricingRuleCard({
  rule,
  onToggle,
}: {
  rule: PricingRule;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-input border transition-colors ${
        rule.active ? 'border-accent-blue bg-surface-muted/50' : 'border-line bg-surface opacity-60'
      }`}
    >
      <div className="flex flex-col gap-1 max-w-xl">
        <div className="flex items-center gap-2">
          <span className="font-display text-body font-bold text-fg">{rule.name}</span>
          <span className="text-caption px-2 py-0.5 rounded bg-surface border border-line font-mono">
            {ruleBadge(rule)}
          </span>
        </div>
        <p className="text-caption text-fg-muted">{rule.description}</p>
        {rule.targetAttachRate ? (
          <span className="text-caption text-accent-blue font-medium">
            Цільовий attach rate: {rule.targetAttachRate}%
          </span>
        ) : null}
      </div>
      <Button variant={rule.active ? 'secondary' : 'primary'} onClick={() => onToggle(rule.id)}>
        {rule.active ? 'Вимкнути' : 'Увімкнути'}
      </Button>
    </div>
  );
}
