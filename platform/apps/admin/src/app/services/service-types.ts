export type ServiceLocation = { id: string; name: string };
export type ServicePrice = { locationId: string; amount: number; active: boolean };
export type CatalogService = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration: number;
  parallelDuration: number | null;
  active: boolean;
  prices: ServicePrice[];
  locations: ServiceLocation[];
};
