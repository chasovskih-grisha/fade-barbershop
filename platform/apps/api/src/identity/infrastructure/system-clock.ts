// Системний годинник — реалізація порта Clock (інжекція у use cases).

import { Injectable } from '@nestjs/common';
import type { Clock } from '../domain/ports';

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
