export interface PricingRule {
  id: string;
  name: string;
  type: 'peak_surcharge' | 'off_peak_discount' | 'bundle_package';
  multiplierOrDiscount: number;
  description: string;
  active: boolean;
  targetAttachRate?: number;
}

export const INITIAL_RULES: PricingRule[] = [
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
    multiplierOrDiscount: 0.9,
    description: '-10% знижка для стимулювання заповнення ранкових порожніх слотів.',
    active: true,
  },
  {
    id: 'rule-3',
    name: 'Комплексний пакет "Executive Grooming" (Стрижка + Борода + Догляд)',
    type: 'bundle_package',
    multiplierOrDiscount: 0.85,
    description: 'Знижка 15% при купівлі комплексу послуг. Підвищує AOV та attach rate.',
    active: true,
    targetAttachRate: 40,
  },
];

export function ruleBadge(rule: PricingRule): string {
  const discount = Math.round((1 - rule.multiplierOrDiscount) * 100);
  if (rule.type === 'peak_surcharge') return `Коефіцієнт: ×${rule.multiplierOrDiscount}`;
  if (rule.type === 'off_peak_discount') return `Знижка: -${discount}%`;
  return `Пакетна економія: ${discount}%`;
}
