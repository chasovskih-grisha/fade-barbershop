// DTO для T-152: застосування знижок, валідація коду, VIP-рівень.
import { IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export class ApplyDiscountRequest {
  /** Базова ціна візиту з каталогу, у копійках. */
  @IsInt()
  @Min(0)
  agreedPriceCents!: number;

  @IsString()
  clientId!: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsISO8601()
  slotStart?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  capPercent?: number;
}

export class ValidatePromoCodeRequest {
  @IsString()
  code!: string;

  @IsString()
  clientId!: string;

  @IsOptional()
  @IsString()
  serviceId?: string;
}

export class VipDiscountRequest {
  @IsString()
  clientId!: string;
}
