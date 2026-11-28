// Хелпери спек релея outbox (T-080, T-4462): рядок повідомлення, фейкові споживачі з
// чергою результатів і збірка диспетчера на пам'яті (без Prisma/Nest).
// Окремо від *.spec.ts — LOC-гейт і спільне використання між спеками релея.
import { OutboxNotificationsDispatcher } from './outbox-dispatcher';
import type { OutboxConsumers } from './outbox-routing';
import type { HandleOutcome } from '../application/send-booking-confirmation';

export const outboxMessage = (id: string, type = 'scheduling.appointment.booked') => ({
  id,
  type,
  aggregateId: 'apt-1',
  payload: { locationId: 'loc-1' },
  createdAt: new Date(),
});

/** Споживач із чергою результатів: outcomes — масив або помилка на кожен виклик. */
const makeConsumer = (outcomes: HandleOutcome[] | Error) => {
  let call = 0;
  return {
    handleOne: jest.fn(async (): Promise<HandleOutcome> => {
      if (outcomes instanceof Error) throw outcomes;
      const next = outcomes[Math.min(call, outcomes.length - 1)];
      if (!next) throw new Error('consumer outcome missing');
      call += 1;
      return next;
    }),
  };
};

/** Споживач чату з тією ж чергою результатів — для кейсів «один push на повідомлення». */
export const makeChatPushConsumer = (outcomes: HandleOutcome[] | Error) =>
  makeConsumer(outcomes) as OutboxConsumers['chatPush'];

export const makeConsumers = (outcomes: HandleOutcome[] | Error): OutboxConsumers => ({
  confirmations: makeConsumer(outcomes) as OutboxConsumers['confirmations'],
  alerts: makeConsumer(outcomes) as OutboxConsumers['alerts'],
  schedule: makeConsumer(outcomes) as OutboxConsumers['schedule'],
  reminders: makeConsumer(outcomes) as OutboxConsumers['reminders'],
  loyalty: makeConsumer(outcomes) as OutboxConsumers['loyalty'],
  appointmentPush: makeConsumer(outcomes) as OutboxConsumers['appointmentPush'],
  chatPush: makeChatPushConsumer(outcomes),
});

export const makeRelay = (
  outcomes: HandleOutcome[] | Error,
  messages = [outboxMessage('evt-1')]
) => {
  const findMany = jest.fn().mockResolvedValue(messages);
  const update = jest.fn().mockResolvedValue({});
  const prisma = { outboxMessage: { findMany, update } };
  const consumers = makeConsumers(outcomes);
  return {
    dispatcher: new OutboxNotificationsDispatcher(prisma as never, consumers),
    findMany,
    update,
    consumers,
  };
};
