// Discounts Admin API — T-153: Admin Discount Management.
// CRUD for discount rules and promo codes, validation, audit logging.

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IdempotencyKey } from '../../shared/decorators/idempotency-key.decorator';
import { DiscountsAdminService } from './discounts-admin.service';
import {
  CreateDiscountRuleInput,
  type CreateDiscountRuleInput,
  CreatePromoCodeInput,
  type CreatePromoCodeInput,
  DiscountRuleFilters,
  type DiscountRuleFilters,
  PromoCodeFilters,
  type PromoCodeFilters,
  ApplyDiscountRuleInput,
  type ApplyDiscountRuleInput,
  DiscountAuditLog,
  type DiscountAuditLog,
} from './discounts-admin.dto';
import { IdempotencyKey } from '../../shared/decorators/idempotency-key.decorator';

@Controller('discounts-admin')
@ApiTags('discounts-admin')
export class DiscountsAdminController {
  constructor(private readonly discountsAdminService: DiscountsAdminService) {}

  /** Admin: create discount rule */
  @Post('rule')
  @ApiOperation({ summary: 'Create discount rule' })
  @ApiResponse({
    status: 201,
    description: 'Discount rule created',
  })
  @HttpCode(HttpStatus.CREATED)
  async createDiscountRule(
    @Body() body: CreateDiscountRuleInput,
  ): Promise<DiscountRule> {
    // Implementation: create discount rule in Prisma
    const rule = await prisma.$executeRaw`
      INSERT INTO DiscountRule (id, name, type, value_type, value, applicable_to, service_ids, category_ids, client_ids, valid_from, valid_until, usage_limit_total, usage_limit_per_client, current_usage_total, current_usage_per_client, description, status, created_at, created_by, updated_at)
      VALUES (uuid(), ${body.name}, ${body.type}, ${body.valueType}, ${body.value}, ${body.applicableTo}, ${body.serviceIds}, ${body.categoryIds}, ${body.clientIds}, ${body.validFrom}, ${body.validUntil}, ${body.usageLimitTotal}, ${body.usageLimitPerClient}, 0, '{}', 'active', NOW(), ${body.createdBy}, NOW())
    `;
    return rule as any;
  }

  /** Admin: list discount rules with filters */
  @Get('rules')
  @ApiOperation({ summary: 'List discount rules with filters' })
  @ApiQuery({ name: 'type', enum: ['first_visit', 'off_peak', 'day_of_week', 'category', 'service', 'client', 'birthday'], required: false })
  @ApiQuery({ name: 'status', enum: ['active', 'inactive', 'archived'], required: false })
  @ApiQuery({ name: 'applicableTo', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Return paginated discount rules list',
  })
  @HttpCode(HttpStatus.OK)
  async listDiscountRules(
    @Query() filters: DiscountRuleFilters,
  ) {
    // Implementation: query discount rules from Prisma with filters
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.applicableTo) where.applicable_to = filters.applicableTo;
    if (filters.clientId) where.client_ids = { has: filters.clientId };

    const rules = await prisma.discountRule.findMany({ where });
    return rules;
  }

  /** Admin: create promo code */
  @Post('promo-code')
  @ApiOperation({ summary: 'Create promo code' })
  @ApiResponse({
    status: 201,
    description: 'Promo code created',
  })
  @HttpCode(HttpStatus.CREATED)
  async createPromoCode(
    @Body() body: CreatePromoCodeInput,
  ): Promise<PromoCode> {
    // Implementation: create promo code in Prisma
    const code = await prisma.$executeRaw`
      INSERT INTO PromoCode (id, code, percent, amount_cents, valid_from, valid_until, usage_limit_total, usage_limit_per_client, current_usage_total, current_usage_per_client, applicable_to, service_ids, client_ids, description, status, created_at, created_by, updated_at)
      VALUES (uuid(), ${body.code.toUpperCase()}, ${body.percent}, ${body.amountCents}, ${body.validFrom}, ${body.validUntil}, ${body.usageLimitTotal}, ${body.usageLimitPerClient}, 0, '{}', ${body.applicableTo}, ${body.serviceIds}, ${body.clientIds}, ${body.description}, 'active', NOW(), ${body.createdBy}, NOW())
    `;
    return code as any;
  }

  /** Admin: list promo codes with filters */
  @Get('promo-codes')
  @ApiOperation({ summary: 'List promo codes with filters' })
  @ApiQuery({ name: 'status', enum: ['active', 'inactive', 'expired'], required: false })
  @ApiQuery({ name: 'applicableTo', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Return paginated promo codes list',
  })
  @HttpCode(HttpStatus.OK)
  async listPromoCodes(
    @Query() filters: PromoCodeFilters,
  ) {
    // Implementation: query promo codes from Prisma with filters
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.applicableTo) where.applicable_to = filters.applicableTo;
    if (filters.clientId) where.client_ids = { has: filters.clientId };

    const codes = await prisma.promoCode.findMany({ where });
    return codes;
  }

  /** Admin: apply a discount rule to an appointment */
  @Post('rule/apply')
  @ApiOperation({ summary: 'Apply discount rule to appointment' })
  @ApiResponse({
    status: 200,
    description: 'Return price breakdown with applied discounts',
  })
  @HttpCode(HttpStatus.OK)
  async applyDiscountRule(
    @Body() body: ApplyDiscountRuleInput,
  ) {
    // Implementation: calculate discounts using the DiscountCalculator
    const result = calculateDiscounts({
      agreedPrice: body.agreedPrice,
      rules: [{ type: 'rule', sourceId: body.ruleId }],
      vip: undefined,
      promoCode: undefined,
      capPercent: 30,
    });

    return {
      success: true,
      breakdown: result,
    };
  }

  /** Admin: audit log for discount modification */
  @Post('audit-log')
  @ApiOperation({ summary: 'Create audit log entry for discount modification' })
  @ApiResponse({
    status: 201,
    description: 'Audit log entry created',
  })
  @HttpCode(HttpStatus.CREATED)
  async createAuditLog(
    @Body() body: { discountId: string; discountType: 'rule' | 'promo_code'; action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate'; changedBy: string; details?: string },
  ) {
    // Implementation: create audit log entry
    const logEntry = await prisma.$executeRaw`
      INSERT INTO DiscountAuditLog (id, discount_id, discount_type, action, changed_by, changed_at, details)
      VALUES (uuid(), ${body.discountId}, ${body.discountType}, ${body.action}, ${body.changedBy}, NOW(), ${body.details})
    `;
    return { success: true, logEntry };
  }
}