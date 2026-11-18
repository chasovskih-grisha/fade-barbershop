// Функціональна специфікація SetAppointmentReference (T-043): клієнт/адмін
// ставлять референс і коментар. Захисні гілки (довжина, барбер, lock,
// термінальний, невідомий id) — set-appointment-reference.guards.spec.ts.
import {
  setupReference as setup,
  referenceCmd as cmd,
  confirmedAppointment,
} from './set-appointment-reference.fakes';
import type { FakeAppointmentRepository } from './appointment-lifecycle.fakes';

const lastSaved = (repo: FakeAppointmentRepository) => repo.saved.at(-1);

describe('SetAppointmentReference (T-043): запис референса і коментаря', () => {
  it('клієнт ставить референс і коментар: збережено, подія чіпляється', async () => {
    const { useCase, repo } = setup();
    await useCase.handle(cmd({ referenceId: 'ref-42', comment: 'зняти на 2 мм' }));

    const saved = lastSaved(repo);
    expect(saved?.data.haircutReferenceId).toBe('ref-42');
    expect(saved?.data.appointmentComment).toBe('зняти на 2 мм');
    expect(saved?.pullEvents().at(-1)?.type).toBe('scheduling.appointment.reference_changed');
  });

  it('коментар рівно 500 — ок (межа включно, REF-WEB-02)', async () => {
    const { useCase, repo } = setup();
    await useCase.handle(cmd({ comment: 'x'.repeat(500) }));

    expect(repo.saved).toHaveLength(1);
    expect(lastSaved(repo)?.data.appointmentComment).toHaveLength(500);
  });

  it('лише referenceId без коментаря: undefined-поля не потрапляють у подію', async () => {
    const { useCase, repo } = setup();
    await useCase.handle(cmd({ referenceId: 'ref-7' }));

    const saved = lastSaved(repo);
    expect(saved?.data.haircutReferenceId).toBe('ref-7');
    expect(saved?.data.appointmentComment ?? null).toBeNull();
    expect(saved?.pullEvents().at(-1)?.payload).not.toHaveProperty('comment');
  });

  it("'' прибирає значення на рядку Booking", async () => {
    const { useCase, repo } = setup();
    await useCase.handle(cmd({ referenceId: 'ref-42', comment: 'текст' }));
    await useCase.handle(cmd({ referenceId: '', comment: '' }));

    expect(lastSaved(repo)?.data.haircutReferenceId).toBeNull();
    expect(lastSaved(repo)?.data.appointmentComment).toBeNull();
  });

  it('адмін змінює коментар і після підтвердження (REF-ADM-04), дія логується', async () => {
    const { useCase, repo } = setup(confirmedAppointment());
    await useCase.handle(cmd({ actorRole: 'admin', actorId: 'admin-1', comment: 'виправлення' }));

    expect(lastSaved(repo)?.data.appointmentComment).toBe('виправлення');
    expect(lastSaved(repo)?.pullEvents().at(-1)?.type).toBe(
      'scheduling.appointment.reference_changed'
    );
  });
});
