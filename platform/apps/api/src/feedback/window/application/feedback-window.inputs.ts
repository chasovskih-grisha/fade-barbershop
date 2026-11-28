// Вхідні форми застосункового шару (T-150): відкриття вікна з події візиту і
// подання відгуку клієнтом.
export type OpenFeedbackWindowInput = {
  appointmentId: string;
  clientId: string;
  barberId?: string | null;
  locationId?: string | null;
  completedAt?: Date;
  windowDays?: number;
};

export type SubmitFeedbackInput = {
  appointmentId: string;
  userId: string;
  rating: number;
  text: string;
  photoIds?: string[];
};
