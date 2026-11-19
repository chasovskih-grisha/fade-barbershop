// Discounts API — T-152: promocode, rules and VIP applied by one calculator.
// Endpoints: POST /api/discounts/apply, /validate-promo, /vip-discount.

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplyDiscountService, type ApplyDiscountResult } from './apply-discount.use-case';
import {
  ApplyDiscountRequest,
  ValidatePromoCodeRequest,
  VipDiscountRequest,
} from './apply-discount.dto';

@Controller('discounts')
@ApiTags('discounts')
export class DiscountsController {
  constructor(private readonly discounts: ApplyDiscountService) {}

  /** Розбивка ціни із застосованими знижками (DSC-006). */
  @Post('apply')
  @ApiOperation({ summary: 'Apply promo code, automatic rules and VIP to an appointment' })
  @HttpCode(HttpStatus.OK)
  async applyDiscounts(@Body() body: ApplyDiscountRequest): Promise<ApplyDiscountResult> {
    return this.discounts.apply({
      agreedPriceCents: body.agreedPriceCents,
      clientId: body.clientId,
      ...(body.serviceId ? { serviceId: body.serviceId } : {}),
      ...(body.promoCode ? { promoCode: body.promoCode } : {}),
      ...(body.slotStart ? { slotStart: new Date(body.slotStart) } : {}),
      ...(body.timeZone ? { timeZone: body.timeZone } : {}),
      ...(body.capPercent !== undefined ? { capPercent: body.capPercent } : {}),
    });
  }

  /** Миттєва перевірка коду для поля «Промокод» (DSC-WEB-01/02). */
  @Post('validate-promo')
  @ApiOperation({ summary: 'Validate a promo code (case-insensitive)' })
  @HttpCode(HttpStatus.OK)
  async validatePromoCode(@Body() body: ValidatePromoCodeRequest) {
    return this.discounts.validatePromoCode(body.code, body.clientId, body.serviceId);
  }

  /** VIP-рівень клієнта для профілю (DSC-VIP-02). */
  @Post('vip-discount')
  @ApiOperation({ summary: 'Get client VIP discount level' })
  @HttpCode(HttpStatus.OK)
  async getVipDiscount(@Body() body: VipDiscountRequest) {
    return this.discounts.vipDiscount(body.clientId);
  }
}
