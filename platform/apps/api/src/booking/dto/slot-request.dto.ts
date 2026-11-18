export interface SlotRequestDto {
  locationId: string;
  /** YYYY-MM-DD; used to hide occupied barbers and chairs for this actual day. */
  date: string;
  serviceId: string;
  fulfillmentMode?: 'sequential' | 'parallel';
  /** Optional specific barber – if omitted, any free barber is considered */
  barberId?: string;
}
