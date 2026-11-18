export interface ClientNote {
  id: string;
  text: string;
  authorId: string;
  authorRole: string;
  visibleToClient: boolean;
  createdAt: string;
}

export interface ClientPreference {
  id: string;
  text: string;
  createdAt: string;
}

export interface ClientDetail {
  id: string;
  userId: string;
  name: string | null;
  phone: string;
  preferences: ClientPreference[];
  notes: ClientNote[];
  vipDiscountPercent: number | null;
  loyaltyVisitsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ClientTab = 'profile' | 'preferences' | 'visits' | 'notes' | 'loyalty';
