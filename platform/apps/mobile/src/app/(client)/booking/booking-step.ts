export type Step = 'service' | 'barber' | 'slot' | 'confirm' | 'payment' | 'done';

export const STEP_TITLES: Record<Step, string> = {
  service: 'Запис',
  barber: 'Запис',
  slot: 'Дата й час',
  confirm: 'Підтвердження',
  payment: 'Депозит',
  done: 'Вас записано',
};
