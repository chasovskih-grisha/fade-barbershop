// Системний годинник — реалізація порта Clock контексту haircut-ai.
// (Конвенція crm/locations: у кожного контексту власний адаптер, залежностей
// між контекстами в інфраструктурі немає.)

import { Injectable } from '@nestjs/common';
import type { Clock } from '../domain/ports';

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
