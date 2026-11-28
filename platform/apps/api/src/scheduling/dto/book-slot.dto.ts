// DTO створення бронювання адміном (контролер admin-bookings).
/** Джерело запису (T-046): канал аналітики ANL-004. */
export type BookingOrigin = { clientId?: string; source?: 'web' | 'admin' | 'walk_in' | 'mobile' };

export interface BookSlotDto {
  /** Якщо не вказано, система обирає вільного барбера. */
  barberId?: string;
  /** Ідентифікатор локації (для отримання OpeningHours). */
  locationId: string;
  date: string;
  start: string;
  end: string;
  /** Тривалість послуги у хвилинах (за замовчуванням 30). */
  serviceDuration?: number;
  serviceId?: string;
  fulfillmentMode?: 'sequential' | 'parallel';
  /** Обраний варіант тривалості послуги (T-4419). */
  variantLabel?: string;
  /** Референс зачіски і коментар (T-043): снепшот на записі. */
  reference?: { haircutReferenceId?: string; appointmentComment?: string };
  /** Джерело запису (T-046): канал аналітики + клієнт з CRM/identity. */
  origin?: BookingOrigin;
}

export interface ServicePreparation {
  duration: number;
  snapshot?: {
    serviceId: string;
    agreedPrice: number;
    agreedDuration?: number;
    fulfillmentMode?: 'sequential' | 'parallel';
    /** Підпис обраного варіанта тривалості (T-4419). */
    durationVariant?: string;
  };
}
