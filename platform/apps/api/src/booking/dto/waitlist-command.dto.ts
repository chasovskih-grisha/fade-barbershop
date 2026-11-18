import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class JoinWaitlistDto {
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsOptional()
  @IsString()
  barberId?: string;
}

export class CancelWaitlistDto {
  @IsString()
  @IsNotEmpty()
  entryId: string;
}
