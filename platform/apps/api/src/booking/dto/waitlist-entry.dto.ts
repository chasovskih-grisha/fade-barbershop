export interface WaitlistEntryDto {
  id: string;
  clientId: string;
  locationId: string;
  serviceId: string;
  barberId: string | undefined;
  status: 'WAITING' | 'OFFERED' | 'BOOKED' | 'EXPIRED' | 'CANCELLED';
  waitingSince: Date;
  vipLevel: number; // 0 normal, 1 VIP
  noShowCount90d: number;
  holdExpiresAt?: Date;
}