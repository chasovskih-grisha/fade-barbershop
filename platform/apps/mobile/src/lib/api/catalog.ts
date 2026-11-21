import { apiBase } from './api-base';

export interface ServiceDto {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

export async function fetchServices(): Promise<ServiceDto[]> {
  const res = await fetch(`${apiBase()}/services`);
  if (!res.ok) throw new Error('Failed to fetch services');
  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}
