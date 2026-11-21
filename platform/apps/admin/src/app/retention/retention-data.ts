export interface InactiveClient {
  id: string;
  name: string;
  phone: string;
  lastVisitDate: string;
  totalSpent: number;
  visitsCount: number;
}

export const INITIAL_CLIENTS: InactiveClient[] = [
  {
    id: 'client-101',
    name: 'Maksym Velychko',
    phone: '+380675554433',
    lastVisitDate: '2026-08-15',
    totalSpent: 3400,
    visitsCount: 8,
  },
  {
    id: 'client-102',
    name: 'Dmytro Kozak',
    phone: '+380507778899',
    lastVisitDate: '2026-07-01',
    totalSpent: 6200,
    visitsCount: 15,
  },
  {
    id: 'client-103',
    name: 'Andriy Melnichenko',
    phone: '+380931234567',
    lastVisitDate: '2026-10-05',
    totalSpent: 1200,
    visitsCount: 3,
  },
];

export const KPI_CARDS = [
  {
    label: 'Активна базова база',
    value: '1,420',
    note: '+12% цього місяця',
    tone: 'text-fg',
    noteTone: 'text-semantic-success',
  },
  {
    label: 'Неактивні (>30 днів)',
    value: '312',
    note: 'Готові до Win-Back',
    tone: 'text-semantic-warning',
    noteTone: 'text-fg-muted',
  },
  {
    label: 'Реактивовані',
    value: '84',
    note: '27% конверсія',
    tone: 'text-accent-blue',
    noteTone: 'text-semantic-success',
  },
  {
    label: 'Середній LTV',
    value: '8,450 UAH',
    note: '+450 UAH vs торік',
    tone: 'text-accent-blue',
    noteTone: 'text-semantic-success',
  },
];
