// T-4457: сторінка «Мій код» у клієнтських поверхнях.
// GET /referrals/:clientId/code-page — код, посилання, QR-payload, статуси
// запрошених без персональних даних і місячний ліміт. `at` приймається для
// перевірки ліміту на конкретну дату без очікування календаря.
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ReferralCodePageService,
} from '../application/referral-code-page.service';
import {
  ReferralCodePageError,
  type ReferralCodePageView,
} from '../domain/referral-code-page';

@ApiTags('referrals')
@Controller('referrals')
export class ReferralCodePageController {
  constructor(private readonly pages: ReferralCodePageService) {}

  @Get(':clientId/code-page')
  @ApiParam({ name: 'clientId' })
  @ApiOperation({ summary: 'Мій реферальний код, посилання, QR і статуси запрошених' })
  async page(
    @Param('clientId') clientId: string,
    @Query('at') at?: string
  ): Promise<ReferralCodePageView> {
    try {
      return await this.pages.getPage(clientId, parseAt(at));
    } catch (error) {
      if (error instanceof ReferralCodePageError) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }
}

function parseAt(value?: string): Date | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) throw new BadRequestException(`Invalid at: ${value}`);
  return at;
}
