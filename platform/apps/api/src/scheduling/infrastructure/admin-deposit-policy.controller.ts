// AdminDepositPolicyController — політика депозиту (PAY-ADM-09) як
// адмін-налаштування: % від ціни, округлення і вікно скасування читаються
// записом візиту, тому PUT діє лише на нові записи. T-4444: кожна зміна
// правил отримує версію, історія доступна окремим GET. Охороняється
// глобальним AdminSessionGuard (APP_GUARD фільтрує /admin/*).
import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaDepositPolicySettings } from './prisma-deposit-policy-settings';
import {
  DEPOSIT_ROUNDING_OPTIONS,
  parseDepositPolicySettings,
  type DepositPolicyVersionRow,
  type VersionedDepositPolicy,
} from '../domain/deposit-policy-settings';
import type { DepositPolicy } from '../domain/deposit-terms';

@ApiTags('admin-settings')
@Controller('admin/settings/deposit-policy')
export class AdminDepositPolicyController {
  constructor(private readonly settings: PrismaDepositPolicySettings) {}

  @Get()
  @ApiOperation({ summary: 'Поточна політика депозиту і її версія (PAY-ADM-09)' })
  async get(): Promise<VersionedDepositPolicy> {
    return this.settings.getVersioned();
  }

  @Get('history')
  @ApiOperation({ summary: 'Історія затверджених правил депозиту (T-4444)' })
  async history(): Promise<DepositPolicyVersionRow[]> {
    return this.settings.history();
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Змінити політику депозиту для нових записів' })
  async update(@Body() body: unknown): Promise<VersionedDepositPolicy> {
    const current = await this.settings.getVersioned();
    // PUT приймає часткові зміни; невалідне поле не переписує чинну політику.
    const merged = parseDepositPolicySettings({ ...current, ...validPatch(body) });
    return this.settings.set(merged);
  }
}

/** Тільки валідні ключі: тихо відкидаємо сміття, а не змінюємо гроші навмання. */
function validPatch(body: unknown): Partial<DepositPolicy> {
  const raw = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  const patch: Partial<DepositPolicy> = {};
  const percent = intInRange(raw.percent, 0, 100);
  if (percent !== null) patch.percent = percent;
  const window = intInRange(raw.cancellationWindowHours, 0, 72);
  if (window !== null) patch.cancellationWindowHours = window;
  if (DEPOSIT_ROUNDING_OPTIONS.includes(raw.rounding as never)) {
    patch.rounding = raw.rounding as number;
  }
  return patch;
}

function intInRange(input: unknown, min: number, max: number): number | null {
  if (typeof input !== 'number' || !Number.isFinite(input)) return null;
  const value = Math.round(input);
  return value < min || value > max ? null : value;
}
