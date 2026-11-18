import type { Service } from './service';

export interface Clock {
  now(): Date;
}

export interface ServiceRepository {
  findById(id: string): Promise<Service | null>;
  findByName(name: string, duration: number): Promise<Service | null>;
  save(service: Service): Promise<void>;
  list(): Promise<Service[]>;
  listActive(): Promise<Service[]>;
}

export interface ServicePriceData {
  id?: string;
  serviceId: string;
  locationId: string;
  amount: number;
  active: boolean;
  updatedAt: Date;
}

export interface ServicePriceRepository {
  find(serviceId: string, locationId: string): Promise<ServicePriceData | null>;
  savePrice(price: ServicePriceData): Promise<void>;
  listForService(serviceId: string): Promise<ServicePriceData[]>;
  listActiveByLocation(locationId: string): Promise<ServicePriceData[]>;
}
