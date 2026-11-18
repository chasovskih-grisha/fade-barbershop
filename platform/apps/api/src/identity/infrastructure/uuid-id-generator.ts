// Генерація ID — ulid-подібний рядок/нижній hex з node:crypto (незалежний від БД).

import { Injectable } from '@nestjs/common';
import { uuidv7 } from '@fade/domain-shared';
import type { IdGenerator } from '../domain/ports';

@Injectable()
export class UuidIdGenerator implements IdGenerator {
  id(): string {
    return uuidv7();
  }
}
