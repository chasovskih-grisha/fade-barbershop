// Спільні типи даних дашборда: форма відповіді GET /admin/calendar.
export interface CalendarVisitDto {
  id: string;
  start: string;
  end: string;
  status: string;
  barberId: string;
  locationId: string;
  agreedPrice: number | null;
}

export interface DashboardData {
  visits: CalendarVisitDto[];
  barbers: { id: string; name: string | null }[];
  locations: { id: string; name: string }[];
}
