// T-4459: HTTP-поверхня авто-кампанії «День народження» в адмінці.
// Прев'ю — те, що піде зараз (без надсилання); run — фактичне надсилання;
// history — журнал надсилань і аудит змін дати. `at` приймається для
// відтворення/перевірки вікна без очікування календаря.
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  BirthdayCampaignService,
  type BirthdayCampaignRunSummary,
} from '../application/birthday-campaign.service';
import {
  BirthdayCampaignError,
  type BirthdayAuditEntry,
  type BirthdayCampaignPlan,
  type BirthdayDate,
} from '../domain/birthday-campaign';

function parseAt(value?: string): Date | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) throw new BadRequestException(`Invalid at: ${value}`);
  return at;
}

function mapError(error: unknown): never {
  if (error instanceof BirthdayCampaignError) {
    if (error.message.includes('not found')) throw new NotFoundException(error.message);
    throw new BadRequestException(error.message);
  }
  throw new BadRequestException(error instanceof Error ? error.message : String(error));
}

@ApiTags('admin-campaigns')
@Controller('admin/campaigns/birthday')
export class AdminBirthdayCampaignController {
  constructor(private readonly birthday: BirthdayCampaignService) {}

  @Get('preview')
  @ApiOperation({ summary: 'Кому піде привітання зараз і кого пропускаємо' })
  async preview(@Query('at') at?: string): Promise<BirthdayCampaignPlan> {
    try {
      return await this.birthday.preview(parseAt(at));
    } catch (error) {
      mapError(error);
    }
  }

  @Post('run')
  @ApiOperation({ summary: 'Надіслати привітання: раз на рік, лише зі згодою' })
  async run(@Body() body: { at?: string } = {}): Promise<BirthdayCampaignRunSummary> {
    try {
      return await this.birthday.run(parseAt(body.at));
    } catch (error) {
      mapError(error);
    }
  }

  @Get('history')
  @ApiOperation({ summary: 'Журнал надсилань і аудит змін дати народження' })
  history(): ReturnType<BirthdayCampaignService['history']> {
    return this.birthday.history();
  }

  @Post('clients/:clientId/date')
  @ApiOperation({ summary: 'Підтвердити або виправити дату народження (з аудитом)' })
  async setDate(
    @Param('clientId') clientId: string,
    @Body() body: { day: number; month: number; by: string; at?: string; source?: 'client' | 'admin' }
  ): Promise<{ audit: BirthdayAuditEntry; clientId: string; birthday: BirthdayDate }> {
    try {
      const result = await this.birthday.verifyDate({
        clientId,
        birthday: { day: body.day, month: body.month },
        by: body.by ?? '',
        ...(body.source ? { source: body.source } : {}),
        ...(parseAt(body.at) ? { at: parseAt(body.at) as Date } : {}),
      });
      return {
        audit: result.audit,
        clientId: result.client.clientId,
        birthday: result.client.birthday as BirthdayDate,
      };
    } catch (error) {
      mapError(error);
    }
  }
}
