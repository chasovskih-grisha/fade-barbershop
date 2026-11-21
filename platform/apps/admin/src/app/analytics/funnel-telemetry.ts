export interface FunnelTelemetryEvent {
  id: string;
  stepName: string;
  clientName: string;
  locationName: string;
  timestamp: string;
  status: 'success' | 'abandoned' | 'step-completed';
}

export const INITIAL_EVENTS: FunnelTelemetryEvent[] = [
  {
    id: '1',
    stepName: 'Вибір часу (Slot Selection)',
    clientName: 'Олександр М.',
    locationName: 'FADE Central (Хрещатик)',
    timestamp: 'Щойно',
    status: 'abandoned',
  },
  {
    id: '2',
    stepName: 'Підтвердження платежу',
    clientName: 'Дмитро К.',
    locationName: 'FADE Podil (Сагайдачного)',
    timestamp: '1 хв тому',
    status: 'success',
  },
  {
    id: '3',
    stepName: 'Вибір послуги',
    clientName: 'Максим В.',
    locationName: 'FADE Pechersk (Лексеїча)',
    timestamp: '3 хв тому',
    status: 'step-completed',
  },
];

const NAMES = ['Андрій Т.', 'Євгеній П.', 'Сергій Б.', 'Артем Л.', 'Володимир С.'];
const STEPS = [
  'Початок бронювання',
  'Вибір послуги',
  'Вибір майстра',
  'Вибір часу (Slot Selection)',
  'Підтвердження',
];
const LOCATIONS = ['FADE Central (Хрещатик)', 'FADE Podil (Сагайдачного)', 'FADE Pechersk'];
const STATUSES: Array<FunnelTelemetryEvent['status']> = ['success', 'abandoned', 'step-completed'];

function pick<T>(items: T[], fallback: T): T {
  return items[Math.floor(Math.random() * items.length)] ?? fallback;
}

export function createRandomEvent(): FunnelTelemetryEvent {
  return {
    id: Date.now().toString(),
    stepName: pick(STEPS, 'Вибір послуги'),
    clientName: pick(NAMES, 'Клієнт'),
    locationName: pick(LOCATIONS, 'FADE Central'),
    timestamp: 'Щойно',
    status: pick(STATUSES, 'step-completed'),
  };
}
