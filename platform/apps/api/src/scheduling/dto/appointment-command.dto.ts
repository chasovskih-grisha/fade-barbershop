// DTO команд життєвого циклу Appointment (T-042/T-043/T-4533).
export type CommandDto = {
  reason?: string;
  start?: string;
  end?: string;
  /** Нова дата YYYY-MM-DD для reschedule (T-4533). */
  date?: string;
  /** Референс зачіски (T-043): ID або '' — прибрати. */
  referenceId?: string;
  /** Коментар до візиту (T-043): ≤500 символів або '' — прибрати. */
  comment?: string;
};
