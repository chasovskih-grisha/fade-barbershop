import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ServiceDto } from '../dto/service.dto';

/** Simple static repository – loads services from a JSON file. */
@Injectable()
export class StaticServiceRepository {
  private readonly services: ServiceDto[];

  constructor() {
    const file = join(__dirname, 'data', 'services.json');
    try {
      const raw = readFileSync(file, 'utf-8');
      this.services = JSON.parse(raw) as ServiceDto[];
    } catch (e) {
      // Fallback to an empty list if the file is missing – shouldn't happen in prod.
      this.services = [];
    }
  }

  async listByLocation(_locationId: string): Promise<ServiceDto[]> {
    // For now services are the same for every location.
    return this.services;
  }
}
