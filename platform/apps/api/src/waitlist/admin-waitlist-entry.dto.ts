import { IsString, IsOptional, IsEnum, IsDateString, ValidateIf, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/** Input for admin creating a waitlist entry. */
export class AdminCreateWaitlistEntryInput {
  /** The slot ID to create the waitlist entry for */
  @IsString({ message: 'slotId must be a string' })
  @IsNotEmpty({ message: 'slotId is required' })
  slotId: string;

  /** The client ID to add to the waitlist */
  @IsString({ message: 'clientId must be a string' })
  @IsNotEmpty({ message: 'clientId is required' })
  clientId: string;

  /** The location ID where the service will be provided */
  @IsString({ message: 'locationId must be a string' })
  @IsNotEmpty({ message: 'locationId is required' })
  locationId: string;

  /** The barber ID who will provide the service */
  @IsString({ message: 'barberId must be a string' })
  @IsNotEmpty({ message: 'barberId is required' })
  barberId: string;

  /** The service ID being booked */
  @IsString({ message: 'serviceId must be a string' })
  @IsNotEmpty({ message: 'serviceId is required' })
  serviceId: string;

  /** The agreed price for the service */
  @IsString({ message: 'agreedPrice must be a string' })
  @IsNotEmpty({ message: 'agreedPrice is required' })
  agreedPrice: string;

  /** Optional: the date/time slot start (ISO date string) */
  @IsOptional()
  @IsDateString({ message: 'start must be an ISO date string' })
  start?: string;

  /** Optional: the date/time slot end (ISO date string) */
  @IsOptional()
  @IsDateString({ message: 'end must be an ISO date string' })
  end?: string;

  /** Optional: precision/metadata about the entry */
  @IsOptional()
  @IsString({ message: 'precision must be a string if provided' })
  precision?: string;

  /** The status of the waitlist entry */
  @IsOptional()
  @IsEnum(['active', 'on_hold', 'expired', 'fulfilled', 'paused'], {
    message: 'status must be one of: active, on_hold, expired, fulfilled, paused',
  })
  status?: 'active' | 'on_hold' | 'expired' | 'fulfilled' | 'paused';
}