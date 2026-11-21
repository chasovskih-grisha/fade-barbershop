'use client';

import { useState } from 'react';
import { Card, Button } from '@fade/ui';
import PricingRuleCard from './PricingRuleCard';
import PricingImpactBanner from './PricingImpactBanner';
import { INITIAL_RULES, type PricingRule } from './pricing-rules-data';

export type { PricingRule } from './pricing-rules-data';

export function RevenuePricingManager({
  onSaveRule,
}: {
  onSaveRule?: (rule: PricingRule) => void;
}) {
  const [rules, setRules] = useState<PricingRule[]>(INITIAL_RULES);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleValue, setNewRuleValue] = useState('1.10');
  const [newRuleDescription, setNewRuleDescription] = useState('');

  const toggle = (id: string): void => {
    setRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, active: !rule.active } : rule))
    );
  };

  const addRule = (): void => {
    if (!newRuleName.trim()) return;
    const rule: PricingRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      type: 'peak_surcharge',
      multiplierOrDiscount: Number(newRuleValue) || 1,
      description: newRuleDescription.trim(),
      active: true,
    };
    setRules((current) => [...current, rule]);
    onSaveRule?.(rule);
    setNewRuleName('');
    setNewRuleValue('1.10');
    setNewRuleDescription('');
  };

  const activeCount = rules.filter((rule) => rule.active).length;

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="font-display text-h2 text-fg">
          FADE — Управління доходом та оптимізація ціноутворення
        </h2>
        <p className="text-body-sm text-fg-muted">
          Динамічні правила націнок, знижок та пакетів для максимізації виручки та AOV.
        </p>
      </div>
      <PricingImpactBanner active={activeCount} total={rules.length} />
      <div className="space-y-3">
        {rules.map((rule) => (
          <PricingRuleCard key={rule.id} rule={rule} onToggle={toggle} />
        ))}
      </div>
      <div className="border-t border-line pt-4 space-y-3">
        <h3 className="font-display text-h3 text-fg">Додати нове правило</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            aria-label="Назва правила"
            placeholder="Назва правила"
            className="rounded-input border border-line bg-surface px-3 py-2 text-fg"
            value={newRuleName}
            onChange={(event) => setNewRuleName(event.target.value)}
          />
          <input
            aria-label="Коефіцієнт або знижка"
            type="number"
            step="0.01"
            className="rounded-input border border-line bg-surface px-3 py-2 text-fg"
            value={newRuleValue}
            onChange={(event) => setNewRuleValue(event.target.value)}
          />
          <input
            aria-label="Опис правила"
            placeholder="Опис ефекту"
            className="rounded-input border border-line bg-surface px-3 py-2 text-fg"
            value={newRuleDescription}
            onChange={(event) => setNewRuleDescription(event.target.value)}
          />
        </div>
        <Button onClick={addRule}>Додати правило</Button>
      </div>
    </Card>
  );
}
