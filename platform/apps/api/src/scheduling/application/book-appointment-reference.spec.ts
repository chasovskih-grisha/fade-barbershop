// T-043/T-046: снепшот референса/коментаря і джерела при бронюванні —
// проходить у Booking і зберігається; коментар >500 і невідомий канал
// відхиляються до будь-якого запису (REF-WEB-02, ANL-004).
import { Booking } from '../domain/booking';
import type { BookingRepository } from '../domain/booking-repository';
import { fakeRepo, slot, useCase } from './book-appointment-reference.fakes';

const savingRepo = (): { repo: BookingRepository; saved: Booking[] } => {
  const saved: Booking[] = [];
  const repo: BookingRepository = { ...fakeRepo(), save: async (b) => void saved.push(b) };
  return { repo, saved };
};

describe('BookAppointment: снепшоти референса і джерела (T-043/T-046)', () => {
  it('снепшот референса і коментаря зберігається разом із бронюванням', async () => {
    const { repo, saved } = savingRepo();
    await useCase(repo, {
      reference: { haircutReferenceId: 'ref-42', appointmentComment: 'зняти на 2 мм' },
    }).execute('barber-1', 'loc-1', slot);
    expect(saved.at(-1)?.haircutReferenceId).toBe('ref-42');
    expect(saved.at(-1)?.appointmentComment).toBe('зняти на 2 мм');
  });

  it('без референса — null-поля, запис працює', async () => {
    const { repo, saved } = savingRepo();
    await useCase(repo).execute('barber-1', 'loc-1', slot);
    expect(saved.at(-1)?.haircutReferenceId).toBeNull();
    expect(saved.at(-1)?.appointmentComment).toBeNull();
  });

  it('коментар 501 символ — InvalidSlotError до запису (REF-WEB-02)', async () => {
    const repo = fakeRepo();
    let saveCalled = false;
    const spy: BookingRepository = {
      ...repo,
      save: async (b) => {
        saveCalled = true;
        return repo.save(b);
      },
    };
    // prettier-ignore
    await expect(useCase(spy, { reference: { appointmentComment: 'x'.repeat(501) } }).execute('barber-1', 'loc-1', slot)).rejects.toThrow('500 characters');
    expect(saveCalled).toBe(false);
  });

  it('джерело і клієнт (T-046): снепшот origin на записі', async () => {
    const { repo, saved } = savingRepo();
    // prettier-ignore
    await useCase(repo, { origin: { clientId: 'client-9', source: 'admin' } }).execute('barber-1', 'loc-1', slot);
    expect(saved.at(-1)?.clientId).toBe('client-9');
    expect(saved.at(-1)?.source).toBe('admin');
  });

  it('без origin — дефолт source=web, clientId=null (ANL-004)', async () => {
    const { repo, saved } = savingRepo();
    await useCase(repo).execute('barber-1', 'loc-1', slot);
    expect(saved.at(-1)?.source).toBe('web');
    expect(saved.at(-1)?.clientId).toBeNull();
  });

  it('невідомий source — InvalidSlotError (канали аналітики закриті)', async () => {
    const repo = fakeRepo();
    // prettier-ignore
    await expect(useCase(repo, { origin: { source: 'carrier_pigeon' as never } }).execute('barber-1', 'loc-1', slot)).rejects.toThrow('Unknown booking source');
  });
});
