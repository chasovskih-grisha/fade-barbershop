import { z } from 'zod';

export const slotRequestZodSchema = z.object({
  locationId: z.string().min(1, 'locationId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  serviceId: z.string().min(1, 'serviceId is required'),
  fulfillmentMode: z.enum(['sequential', 'parallel']).optional(),
  barberId: z.string().optional(),
});

export type SlotRequestZodDto = z.infer<typeof slotRequestZodSchema>;
