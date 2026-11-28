import {
  IsString,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  ValidateNested,
  IsObject,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

/** PATCH /identity/profile/name — name може бути рядком або явно null. */
export class PatchProfileNameInputDto {
  @IsOptional()
  @IsString()
  name?: string;

  /** Дозволяємо явне null — очищення імені. */
  @IsOptional()
  nameExplicitNull?: null;
}

/** День і місяць народження (T-4730): без року. */
export class BirthdayInputDto {
  @IsInt()
  @Min(1)
  @Max(31)
  day!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}

/** PATCH /identity/profile/birthday — день і місяць або явне null (очищення). */
export class PatchProfileBirthdayInputDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BirthdayInputDto)
  birthday?: BirthdayInputDto | null;

  /** Дозволяємо явне null — очищення дня народження. */
  @IsOptional()
  birthdayExplicitNull?: null;
}

/**
 * PATCH /identity/profile/usual-chair — звична локація і барбер (T-4725).
 * Кожне поле опційне й може бути явним null: порожнє значення очищає саме
 * його, друге лишається як було.
 */
export class PatchProfileUsualChairInputDto {
  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @IsOptional()
  @IsUUID()
  barberId?: string | null;
}

/** PATCH /identity/profile/preferences — масив непорожніх рядків. */
export class PatchProfilePreferencesInputDto {
  @IsArray()
  @ArrayMinSize(0)
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  preferences: string[];
}
