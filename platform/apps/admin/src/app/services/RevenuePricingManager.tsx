'use client';

import { useState } from 'react';
import { Card, Button } from '@fade/ui';

export interface PricingRule {
  id: string;
  name: string;
  type: 'peak_surcharge' | 'off_peak_discount' | 'bundle_package';
  multiplierOrDiscount: number; // e.g. 1.15 for +15%, 0.90 for -10%
  description: string;
  active: boolean;
  targetAttachRate?: number; // percentage e.g. 35 for bundles
}

export function RevenuePricingManager({
  onSaveRule,
}: {
  onSaveRule?: (rule: PricingRule) => void;
}) {
  const [rules, setRules] = useState<PricingRule[]>([
    {
      id: 'rule-1',
      name: 'Вечірній піковий коефіцієнт (16:00 - 21:00)',
      type: 'peak_surcharge',
      multiplierOrDiscount: 1.15,
      description: '+15% до ціни послуг у пікові вечірні години для максимізації доходу.',
      active: true,
    },
    {
      id: 'rule-2',
      name: 'Ранкова знижка щасливих годин (09:00 - 12:00)',
      type: 'off_peak_discount',
      multiplierOrDiscount: 0.90,
      description: '-10% знижка для стимулювання заповнення ранкових порожніх слотів.',
      active: true,
    },
    {
      id: 'rule-3',
      name: 'Комплексний пакет "Executive Grooming" (Стрижка + Борода + Догляд)',
      type: 'bundle_package',
      multiplierOrDiscount: 0.85, // 15% bundle savings
      description: 'Знижка 15% при купівлі комплексу послуг. Підвищує AOV та attach rate.',
      active: true,
      targetAttachRate: 40,
    },
  ]);

  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleMultiplier, setNewRuleMultiplier] = useState('1.10');

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, active: !r.active };
          onSaveRule?.(updated);
          return updated;
        }
        return r;
      })
    );
  };

  const addRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    const rule: PricingRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      type: 'peak_surcharge',
      multiplierOrDiscount: parseFloat(newRuleMultiplier) || 1.1,
      description: newRuleDesc || 'Користувацьке правило ціноутворення',
      active: true,
    };
    setRules([...rules, rule]);
    onSaveRule?.(rule);
    setNewRuleName('');
    setNewRuleDesc('');
  };

  // Projected AOV lift & revenue impact calculation
  const activeRulesCount = rules.filter((r) => r.active).length;
  const projectedAovLift = activeRulesCount * 14.5; // estimated % AOV lift
  const estimatedMonthlyRevenueUpside = activeRulesCount * 38500; // UAH upside

  return (
    <Card className="p-6 flex flex-col gap-6 mt-6 border border-line bg-surface">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-h4 font-bold text-fg">
          FADE — Управління доходом та оптимізація ціноутворення (Revenue & Pricing Specialist)
        </h3>
        <p className="text-body text-fg-muted">
          Динамічне керування піковими націнками, ранковими знижками та пакетними бандлами для оптимізації AOV та завантаженості крісел.
        </p>
      </div>

      {/* KPI Impact Banner */}
      <div className="grid gap-4 sm:grid-cols-3 rounded-input bg-surface-sunken p-4 border border-line">
        <div className="flex flex-col">
          <span className="text-caption text-fg-muted">Активних правил оптимізації</span>
          <span className="font-display text-h3 font-bold text-fg">{activeRulesCount} / {rules.length}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption text-fg-muted">Прогнозований приріст AOV</span>
          <span className="font-display text-h3 font-bold text-semantic-success">+{projectedAovLift.toFixed(1)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption text-fg-muted">Орієнтовний додатковий місячний дохід</span>
          <span className="font-display text-h3 font-bold text-fg">+{estimatedMonthlyRevenueUpside.toLocaleString()} ₴</span>
        </div>
      </div>

      {/* Rules list */}
      <div className="flex flex-col gap-3">
        <h4 className="font-display text-body font-semibold text-fg">Активні стратегії та правила</h4>
        <div className="grid gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center justify-between p-4 rounded-input border transition-colors ${
                rule.active ? 'border-accent-blue bg-surface-muted/50' : 'border-line bg-surface opacity-60'
              }`}
            >
              <div className="flex flex-col gap-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-display text-body font-bold text-fg">{rule.name}</span>
                  <span className="text-caption px-2 py-0.5 rounded bg-surface border border-line font-mono">
                    {rule.type === 'peak_surcharge' && `Коефіцієнт: ×${rule.multiplierOrDiscount}`}
                    {rule.type === 'off_peak_discount' && `Знижка: -${Math.round((1 - rule.multiplierOrDiscount) * 100)}%`}
                    {rule.type === 'bundle_package' && `Пакетна економія: ${Math.round((1 - rule.multiplierOrDiscount) * 100)}%`}
                  </span>
                </div>
                <p className="text-caption text-fg-muted">{rule.description}</p>
                {rule.targetAttachRate && (
                  <span className="text-caption text-accent-blue font-medium">
                    Цільовий attach rate: {rule.targetAttachRate}%
                  </span>
                )}
              </div>
              <Button
                variant={rule.active ? 'secondary' : 'primary'}
                onClick={() => toggleRule(rule.id)}
              >
                {rule.active ? 'Вимкнути' : 'Увімкнути'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Add new rule form */}
      <form onSubmit={addRule} className="flex flex-col gap-3 pt-4 border-t border-line">
        <h4 className="font-display text-body font-semibold text-fg">Додати нове правило оптимізації ціни</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Назва правила (напр. VIP-субота)"
            value={newRuleName}
            onChange={(e) => setNewRuleName(e.target.value)}
            className="rounded-input border border-line bg-surface px-3 py-2 text-body text-fg"
          />
          <input
            type="text"
            placeholder="Опис ефекту"
            value={newRuleDesc}
            onChange={(e) => setNewRuleDesc(e.target.value)}
            className="rounded-input border border-line bg-surface px-3 py-2 text-body text-fg"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Множник (напр. 1.12)"
              value={newRuleMultiplier}
              onChange={(e) => setNewRuleMultiplier(e.target.value)}
              className="rounded-input border border-line bg-surface px-3 py-2 text-body text-fg w-28"
            />
            <Button type="submit" variant="primary">Додати</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
