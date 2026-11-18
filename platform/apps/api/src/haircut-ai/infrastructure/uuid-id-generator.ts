// Генерація ID контексту haircut-ai — UUID v7 з node:crypto (незалежна від БД).

import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { IdGenerator } from '../domain/ports';

@Injectable()
export class UuidIdGenerator implements IdGenerator {
  id(): string {
    return uuidv7();
  }
}
