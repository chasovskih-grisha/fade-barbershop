// Захисні гілки SetAppointmentReference (T-043): довжина коментаря,
// заборона барберу, lock після підтвердження, термінальні статуси,
// невідомий id. Успішні сценарії — set-appointment-reference.use-case.spec.ts.
import { CommentTooLongError, ReferenceLockedError } from './set-appointment-reference.use-case';
import { AppointmentNotFoundError } from './appointment-lifecycle.use-case';
import { InvalidTransitionError } from '../domain/appointment.aggregate';
import {
  setupReference,
  referenceCmd,
  confirmedAppointment,
  cancelledAppointment,
} from './set-appointment-reference.fakes';
import { expectRejected, expectRejectsWith } from '@fade/test-utils';

const cmd = referenceCmd;

describe('SetAppointmentReference guards: довжина коментаря (REF-WEB-02)', () => {
  it('501 символ — CommentTooLongError, запис НЕ зберігається', async () => {
    const { useCase, repo } = setupReference();

    await expectRejected(
      useCase.handle(cmd({ comment: 'x'.repeat(501) })),
      CommentTooLongError,
      '500 символів — межа (REF-WEB-02); понад — відхилення до збереження'
    );

    expect(repo.saved).toHaveLength(0);
  });
});

describe('SetAppointmentReference guards: барбер не редагує', () => {
  it("actorRole barber → 'Barber cannot edit', нічого не збережено", async () => {
    const { useCase, repo } = setupReference();

    await expectRejectsWith(
      useCase.handle(cmd({ actorRole: 'barber', actorId: 'barber-1', comment: 'не можна' })),
      /Barber cannot edit/,
      'редагування референса — клієнт або адмін, не виконавець'
    );

    expect(repo.saved).toHaveLength(0);
  });
});

describe('SetAppointmentReference guards: lock після підтвердження (REF-WEB-04)', () => {
  it('клієнт на confirmed — ReferenceLockedError, запис НЕ зберігається', async () => {
    const { useCase, repo } = setupReference(confirmedAppointment());

    await expectRejected(
      useCase.handle(cmd({ comment: 'пізно' })),
      ReferenceLockedError,
      'після підтвердження клієнт більше не редагує'
    );

    expect(repo.saved).toHaveLength(0);
  });
});

describe('SetAppointmentReference guards: термінальний статус', () => {
  it.each([
    ['клієнт', cmd({ comment: 'х' })],
    ['адмін', cmd({ actorRole: 'admin', actorId: 'admin-1', comment: 'х' })],
  ])('%s на cancelled — InvalidTransitionError без збереження', async (_role, command) => {
    const { useCase, repo } = setupReference(cancelledAppointment());

    await expectRejected(
      useCase.handle(command),
      InvalidTransitionError,
      'термінальний запис не редагується навіть адміном'
    );

    expect(repo.saved).toHaveLength(0);
  });
});

describe('SetAppointmentReference guards: невідомий запис', () => {
  it('id немає в репозиторії → AppointmentNotFoundError', async () => {
    const { useCase } = setupReference();

    await expectRejected(
      useCase.handle(cmd({ appointmentId: 'nope', comment: 'х' })),
      AppointmentNotFoundError,
      'не знайшли запис — редагувати нічого'
    );
  });
});
