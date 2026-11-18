// Право барбера редагувати власний графік (T-230, SCH-001/SCH-003). Той самий
// агрегат `Availability`, що редагує адмінка, — self-service лише додає другий
// письменник за політикою доступу: прапорець делегування на барбері та (окремо)
// дозвіл виходити за години роботи локації. Домен без Nest/Prisma/HTTP.

import type { AvailabilityWindowData, ScheduleChangeSource } from './availability';
import type { OpeningHours } from '../../locations/domain/opening-hours';
import { toMinutes } from './time-utils';

export type { ScheduleChangeSource } from './availability';

export interface BarberSchedulePolicy {
  /** SCH-001: адмін делегував барберу редагування графіка; за замовчуванням ні. */
  selfService: boolean;
  /** SCH-003: адмін дозволив барберу виходити за `OpeningHours` локації. */
  allowOutsideHours: boolean;
}

/** Хто редагує графік: політика барбера і джерело зміни. */
export interface ScheduleEditor {
  policy: BarberSchedulePolicy;
  source: ScheduleChangeSource;
}

export class ScheduleNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScheduleNotAllowedError';
  }
}

/** SCH-001: адмін редагує завжди; барбер — лише коли право делеговано. */
export function assertScheduleEditAllowed(editor: ScheduleEditor): void {
  if (editor.source === 'barber' && !editor.policy.selfService) {
    throw new ScheduleNotAllowedError('Schedule editing is not delegated to the barber');
  }
}

/** SCH-003: self-service вікна — жорстко в межах `OpeningHours`; адмін і
 *  явний дозвіл адміна знімають обмеження. */
export function assertWindowsWithinOpeningHours(
  windows: AvailabilityWindowData[],
  opening: OpeningHours,
  editor: ScheduleEditor
): void {
  if (editor.source === 'admin' || editor.policy.allowOutsideHours) return;
  for (const window of windows) {
    const day = opening.days.find((item) => item.dayOfWeek === window.dayOfWeek);
    if (!day || day.closed || !day.open || !day.close) {
      throw new ScheduleNotAllowedError('Window falls on a day the location is closed');
    }
    if (
      toMinutes(window.start) < toMinutes(day.open) ||
      toMinutes(window.end) > toMinutes(day.close)
    ) {
      throw new ScheduleNotAllowedError('Window must fit within location opening hours');
    }
  }
}
