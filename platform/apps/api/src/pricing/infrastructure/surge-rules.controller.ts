// GET/PUT /admin/pricing/surge-rules (T-4811): адмінська частина правила без
// окремого UI (сам екран — фронтенд-лейн). Валідація тут, бо некоректне
// правило інакше просто не спрацює й адмін шукатиме причину в цінах.
import { Body, Controller, Get, HttpCode, HttpStatus, HttpException, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { uuidv7 } from '@fade/domain-shared';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { validateSurgeRule } from '../domain/surge-rule.validation';

interface SurgeRuleBody {
  id?: string;
  locationId?: string | null;
  dayOfWeek?: number | null;
  fromMinute?: number | null;
  toMinute?: number | null;
  seniorityTier?: string | null;
  multiplierBp?: number;
  active?: boolean;
}

@ApiTags('admin-pricing')
@Controller('admin/pricing/surge-rules')
export class SurgeRulesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Правила surge-ціноутворення' })
  async list(@Query('locationId') locationId?: string): Promise<unknown[]> {
    return this.prisma.surgeRule.findMany({
      where: locationId ? { OR: [{ locationId }, { locationId: null }] } : {},
      orderBy: { multiplierBp: 'desc' },
    });
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Створити або замінити правило surge' })
  async upsert(@Body() body: SurgeRuleBody): Promise<unknown> {
    const check = validateSurgeRule(body);
    if (!check.ok) throw new HttpException(check.message, HttpStatus.BAD_REQUEST);
    const data = {
      locationId: body.locationId ?? null,
      dayOfWeek: body.dayOfWeek ?? null,
      fromMinute: body.fromMinute ?? null,
      toMinute: body.toMinute ?? null,
      seniorityTier: body.seniorityTier ?? null,
      multiplierBp: body.multiplierBp ?? 10_000,
      active: body.active ?? true,
    };
    if (body.id) {
      return this.prisma.surgeRule.update({ where: { id: body.id }, data });
    }
    return this.prisma.surgeRule.create({ data: { id: uuidv7(), ...data } });
  }
}
