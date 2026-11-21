/* eslint-disable max-lines -- cohesive module (128 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Discounts Admin Controller — T-153: Admin Discount Management.
// CRUD for discount rules and promo codes, validation, audit logging.
// Consolidated DTO types; service-layer methods for clean separation.

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateDiscountRuleInput,
  CreatePromoCodeInput,
  DiscountRuleFilters,
  PromoCodeFilters,
  ApplyDiscountRuleInput,
  DiscountAuditLog,
  DiscountRuleResponse,
  PromoCodeResponse,
  ApplyDiscountRuleResponse,
  DiscountRulesListResponse,
  PromoCodesListResponse,
} from './discounts-admin.dto';
import { DiscountsAdminService } from './discounts-admin.service';

@Controller('discounts-admin')
@ApiTags('discounts-admin')
export class DiscountsAdminController {
  constructor(private readonly discountsAdminService: DiscountsAdminService) {}

  // POST /api/discounts-admin/rule
  @Post('rule')
  @ApiOperation({ summary: 'Create discount rule' })
  @ApiResponse({
    status: 201,
    type: DiscountRuleResponse,
    description: 'Discount rule created',
  })
  @HttpCode(HttpStatus.CREATED)
  async createDiscountRule(@Body() input: CreateDiscountRuleInput): Promise<DiscountRuleResponse> {
    // Note: createdBy would come from auth context in production; using placeholder for now
    const result = await this.discountsAdminService.createDiscountRule(input, 'admin');
    return result;
  }

  // GET /api/discounts-admin/rules
  @Get('rules')
  @ApiOperation({ summary: 'List discount rules with filters' })
  @ApiQuery({
    name: 'type',
    enum: ['first_visit', 'off_peak', 'day_of_week', 'category', 'service', 'client', 'birthday'],
    required: false,
  })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'inactive', 'archived'],
    required: false,
  })
  @ApiQuery({ name: 'applicableTo', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiResponse({
    status: 200,
    type: DiscountRulesListResponse,
    description: 'Return paginated discount rules list',
  })
  @HttpCode(HttpStatus.OK)
  async listDiscountRules(
    @Query() filters: DiscountRuleFilters
  ): Promise<DiscountRulesListResponse> {
    const result = await this.discountsAdminService.listDiscountRules(filters);
    return result;
  }

  // POST /api/discounts-admin/promo-code
  @Post('promo-code')
  @ApiOperation({ summary: 'Create promo code' })
  @ApiResponse({
    status: 201,
    type: PromoCodeResponse,
    description: 'Promo code created',
  })
  @HttpCode(HttpStatus.CREATED)
  async createPromoCode(@Body() input: CreatePromoCodeInput): Promise<PromoCodeResponse> {
    const result = await this.discountsAdminService.createPromoCode(input, 'admin');
    return result;
  }

  // GET /api/discounts-admin/promo-codes
  @Get('promo-codes')
  @ApiOperation({ summary: 'List promo codes with filters' })
  @ApiQuery({
    name: 'status',
    enum: ['active', 'inactive', 'expired'],
    required: false,
  })
  @ApiQuery({ name: 'applicableTo', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiResponse({
    status: 200,
    type: PromoCodesListResponse,
    description: 'Return paginated promo codes list',
  })
  @HttpCode(HttpStatus.OK)
  async listPromoCodes(@Query() filters: PromoCodeFilters): Promise<PromoCodesListResponse> {
    const result = await this.discountsAdminService.listPromoCodes(filters);
    return result;
  }

  // POST /api/discounts-admin/rule/apply
  @Post('rule/apply')
  @ApiOperation({ summary: 'Apply discount rule to appointment' })
  @ApiResponse({
    status: 200,
    type: ApplyDiscountRuleResponse,
    description: 'Return price breakdown with applied discounts',
  })
  @HttpCode(HttpStatus.OK)
  async applyDiscountRule(
    @Body() body: ApplyDiscountRuleInput
  ): Promise<ApplyDiscountRuleResponse> {
    const result = await this.discountsAdminService.applyDiscountRule(
      body.ruleId,
      body.appointmentId,
      body.agreedPrice,
      body.clientId
    );
    return result;
  }

  // POST /api/discounts-admin/audit-log
  @Post('audit-log')
  @ApiOperation({ summary: 'Create audit log entry for discount modification' })
  @ApiResponse({
    status: 201,
    description: 'Audit log entry created',
  })
  @HttpCode(HttpStatus.CREATED)
  async createAuditLog(
    @Body() body: DiscountAuditLog
  ): Promise<{ success: boolean; logEntry: any }> {
    const result = await this.discountsAdminService.createAuditLog(
      body.discountId,
      body.discountType,
      body.action,
      body.changedBy,
      body.details
    );
    return result;
  }
}
