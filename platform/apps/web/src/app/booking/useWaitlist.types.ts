import type { LocationDto, ServiceDto } from './types';

export interface WaitlistInfo {
  entryId?: string;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
}

export interface UseWaitlistInput {
  location: LocationDto | null;
  service: ServiceDto | null;
  barberId: string;
  date: string;
  setLoading: (value: boolean) => void;
  setError: (value: string) => void;
}
