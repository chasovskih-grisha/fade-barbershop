// ApplyDiscount API — T-152: Discount Mechanics.
// Endpoint: POST /api/discounts/apply
// Calculates applied discounts for an appointment using PromoCode, VIP, and rules.

import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IdempotencyKey } from '../../shared/decorators/idempotency-key.decorator';
import { ApplyDiscountInput, type ApplyDiscountInput } from './apply-discount.use-case';
import { ApplyDiscountResult, type ApplyDiscountResult } from './apply-discount.use-case';

@Controller('discounts')
@ApiTags('discounts')
export class DiscountsController {
  @Post('apply')
  @ApiOperation({ summary: 'Apply discounts to appointment (PromoCode, VIP, rules)' })
  @ApiResponse({
    status: 200,
    type: ApplyDiscountResult,
    description: 'Return price breakdown with applied discounts',
  })
  @HttpCode(HttpStatus.OK)
  async applyDiscounts(
    @Body() body: ApplyDiscountInput,
  ): Promise<ApplyDiscountResult> {
    return applyDiscounts(body);
  }

  /** Validate a promo code. */
  @Post('validate-promo')
  @ApiOperation({ summary: 'Validate a promo code' })
  @ApiResponse({
    status: 200,
    description: 'Return whether promo code is valid and discount amount',
  })
  @HttpCode(HttpStatus.OK)
  async validatePromoCode(
    @Body() { code, clientId }: { code: string; clientId?: string },
  ) {
    return validatePromoCode(code, clientId);
  }

  /** Get client's VIP discount level. */
  @Post('vip-discount')
  @ApiOperation({ summary: 'Get client VIP discount level' })
  @ApiResponse({
    status: 200,
    description: 'Return VIP discount percent and VIP status',
  })
  @HttpCode(HttpStatus.OK)
  async getVipDiscount(
    @Body() { clientId }: { clientId: string },
  ) {
    return getClientVipDiscount(clientId);
  }
}