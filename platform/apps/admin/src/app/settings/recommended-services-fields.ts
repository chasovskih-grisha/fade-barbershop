export interface RecommendedServicesSettings {
  /** Чи увімкнено блок рекомендованих послуг */
  enabled: boolean;
  /** Кількість послуг у блоці (top-N) */
  topN: number;
  /** Manuelний пік ( IDs послуг для змушенею показати, пусте — по статистиці) */
  manualPeak: string[];
  /** ТTL кешування в мілісекундах */
  cacheTtlMs: number;
}
export const DEFAULT_RECOMMENDED_SERVICES_SETTINGS: RecommendedServicesSettings = {
  enabled: false,
  topN: 3,
  manualPeak: [],
  cacheTtlMs: 300000, // 5 хвилин
};
