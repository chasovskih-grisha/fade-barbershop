export interface ClientProfile {
  clientId: string;
  name: string;
  lastVisitDaysAgo: number;
  totalVisits: number;
  totalSpent: number;
}

export interface Campaign {
  tier: string;
  discount: number;
  promo: string;
  bonus: string;
  urgency: string;
}

export const CLIENTS: ClientProfile[] = [
  {
    clientId: 'cli-001',
    name: 'Олександр Петренко',
    lastVisitDaysAgo: 72,
    totalVisits: 4,
    totalSpent: 2400,
  },
  {
    clientId: 'cli-002',
    name: 'Максим Коваленко',
    lastVisitDaysAgo: 38,
    totalVisits: 1,
    totalSpent: 650,
  },
  {
    clientId: 'cli-003',
    name: 'Андрій Шевченко',
    lastVisitDaysAgo: 105,
    totalVisits: 12,
    totalSpent: 9800,
  },
  {
    clientId: 'cli-004',
    name: 'Дмитро Бойко',
    lastVisitDaysAgo: 15,
    totalVisits: 2,
    totalSpent: 1300,
  },
];

/** Chooses a reactivation offer based on how long the client has been away. */
export function calculateCampaign(client: ClientProfile): Campaign {
  if (client.lastVisitDaysAgo >= 90) {
    return {
      tier: '90+ днів неактивності (Severe Churn Risk)',
      discount: 30,
      promo: `WNB-${client.clientId.toUpperCase()}-30`,
      bonus: 'Безкоштовне підрівнювання бороди та гарячий рушник',
      urgency: 'critical',
    };
  }
  if (client.lastVisitDaysAgo >= 60) {
    return {
      tier: '60 днів неактивності (High Risk)',
      discount: 25,
      promo: `WNB-${client.clientId.toUpperCase()}-25`,
      bonus: 'Фірмовий гель для стайлінгу у подарунок',
      urgency: 'warning',
    };
  }
  if (client.lastVisitDaysAgo >= 30) {
    return {
      tier: '30 днів неактивності (Watchlist)',
      discount: 15,
      promo: `WNB-${client.clientId.toUpperCase()}-15`,
      bonus: 'Пріоритетне бронювання',
      urgency: 'accent',
    };
  }
  return {
    tier: 'Активний клієнт',
    discount: 0,
    promo: 'N/A',
    bonus: 'Реферальний бонус доступний',
    urgency: 'success',
  };
}
