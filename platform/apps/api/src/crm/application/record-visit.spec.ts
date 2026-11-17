// Специфікація проєкції візитів (T-061): функціональний рівень піраміди —
// обробник із фейковими портами, без БД. Перевіряємо ідемпотентність
// (redelivery), відсутність профілю (walk-in) і резолв клієнта за візитом.

import { RecordVisitHandler } from './record-visit.use-case';
import type { Visit } from '../domain/visit';
import type { VisitRepository } from '../domain/visit.repository';

class InMemoryVisits implements VisitRepository {
  store = new Map<string, Visit>();
  async findByAppointmentId(id: string): Promise<Visit | null> {
    return this.store.get(id) ?? null;
  }
  async save(visit: Visit): Promise<void> {
    this.store.set(visit.appointmentId, visit);
  }
  async listByClientId(clientId: string): Promise<Visit[]> {
    return [...this.store.values()].filter((v) => v.clientId === clientId);
  }
}

const at = (iso: string) => new Date(iso);

describe('проєкція історії візитів (T-061)', () => {
  it('подія booked створює факт візиту для відомого клієнта', async () => {
    const visits = new InMemoryVisits();
    const handler = new RecordVisitHandler({
      visits,
      clients: { clientIdOf: async () => 'client-1' },
    });

    const out = await handler.handle({
      event: {
        type: 'scheduling.appointment.booked',
        occurredAt: at('2026-11-02T09:00:00Z'),
        payload: { appointmentId: 'apt-1', barberId: 'barber-1', start: '10:00', end: '10:30' },
      },
    });

    expect(out.recorded).toBe(true);
    expect(out.visit).toMatchObject({
      appointmentId: 'apt-1',
      clientId: 'client-1',
      status: 'booked',
    });
  });

  it('повторна доставка тієї самої події не дублює факт', async () => {
    const visits = new InMemoryVisits();
    const handler = new RecordVisitHandler({
      visits,
      clients: { clientIdOf: async () => 'client-1' },
    });
    const event = {
      type: 'scheduling.appointment.confirmed',
      occurredAt: at('2026-11-02T09:05:00Z'),
      payload: { appointmentId: 'apt-1' },
    };

    await handler.handle({ event });
    await handler.handle({ event });

    expect(visits.store.size).toBe(1);
    expect([...visits.store.values()][0]?.status).toBe('confirmed');
  });

  it('візит без профілю (анонімний walk-in) проєкцію не створює', async () => {
    const visits = new InMemoryVisits();
    const handler = new RecordVisitHandler({
      visits,
      clients: { clientIdOf: async () => null },
    });

    const out = await handler.handle({
      event: {
        type: 'scheduling.appointment.booked',
        occurredAt: at('2026-11-02T09:00:00Z'),
        payload: { appointmentId: 'apt-1' },
      },
    });

    expect(out.recorded).toBe(false);
    expect(visits.store.size).toBe(0);
  });
});
