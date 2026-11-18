// DTO GET /admin/clients (T-4606a/T-4606b) — дзеркало відповіді API
// (crm/application/admin-client-list.view.ts + client-list-summary.types.ts):
// {items,total,page,pages,summary}.
export interface ClientListItem {
  id: string;
  userId: string;
  name: string | null;
  phone: string;
  visits: number;
  lastVisit: string | null;
  /** Прогрес лояльності «X/7» (LYL-ADM-02); ціль 7 — константа UI. */
  loyaltyVisits: number;
  vipDiscountPercent: number | null;
}

/** Стрічка підсумків §6.1 (T-4606b): цифри по всьому фільтру, не по сторінці. */
export interface ClientListSummary {
  /** Той самий `total`, що й у таблиці (`summary.total === total`). */
  total: number;
  period: string;
  /** Межі вікна підсумків у ISO — підпис «що пораховано» в стрічці. */
  from: string;
  to: string;
  newClients: number;
  visits: number;
  revenue: number;
  avgTicket: number;
  /** Частка 0..1; у UI — відсотки. */
  noShowRate: number;
  quietClients: number;
  quietShare: number;
  repeatShare: number;
  loyalty: { none: number; progress: number; freeVisit: number; cycle: number };
  locations: { byLocation: { locationId: string; count: number }[]; noVisit: number };
}

export interface ClientListResult {
  items: ClientListItem[];
  total: number;
  page: number;
  pages: number;
  summary: ClientListSummary;
}
