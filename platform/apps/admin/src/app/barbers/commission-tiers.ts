export type CommissionTier = 'standard' | 'bronze' | 'silver' | 'gold';

export interface CommissionTierOption {
  value: CommissionTier;
  label: string;
  defaultMult: number;
}

export const TIERS: CommissionTierOption[] = [
  { value: 'standard', label: 'Стандарт (Standard - 45%)', defaultMult: 1.0 },
  { value: 'bronze', label: 'Бронза (Bronze - 50%)', defaultMult: 1.05 },
  { value: 'silver', label: 'Срібло (Silver - 55%)', defaultMult: 1.1 },
  { value: 'gold', label: 'Золото (Gold - 60%)', defaultMult: 1.2 },
];
