import { AssignStaffHandler } from './assign-staff';
import { StaffAssignment } from '../domain/staff-assignment';
import { FakeClock, FakeLocationRepository, FakeOutbox, FakeStaffAssignmentRepository, SeqIds, passthroughUow } from './ports.fakes';
import { LocationNotFoundError } from './locations-errors';
import { StaffAlreadyAssignedError, InvalidStaffInputError } from './staff-errors';
import { createLocation } from '../test-helpers.fakes';

const T0 = new Date('2026-09-21T10:00:00.000Z');

function setup() {
  const clock = new FakeClock(T0.toISOString());
  const locations = new FakeLocationRepository();
  const assignments = new FakeStaffAssignmentRepository();
  const outbox = new FakeOutbox();
  const assign = new AssignStaffHandler({
    assignments,
    locations,
    outbox,
    clock,
    ids: new SeqIds(),
    uow: passthroughUow,
  });
  return { assign, assignments, locations, outbox };
}

describe('AssignStaffHandler', () => {
  it('призначає барбера на локацію + подія StaffAssigned', async () => {
    const { assign, assignments, outbox, locations } = setup();
    locations.save(createLocation({ id: 'loc-1' }));

    const result = await assign.handle({ barberId: 'bar-1', locationId: 'loc-1' });

    const assignment = await assignments.findById(result.id);
    expect(assignment?.barberId).toBe('bar-1');
    expect(assignment?.locationId).toBe('loc-1');
    expect(assignment?.createdAt).toBeInstanceOf(Date);
    expect(
      StaffAssignment.reconstitute({
        id: 'test-id',
        barberId: 'bar-1',
        locationId: 'loc-1',
        createdAt: new Date(),
      }).id
    ).toBe('test-id');

    expect(outbox.events.map((e) => e.type)).toEqual(['locations.staff.assigned']);
  });

  it('повторне призначення того ж барбера → StaffAlreadyAssignedError', async () => {
    const { assign, locations } = setup();
    locations.save(createLocation({ id: 'loc-1' }));
    await assign.handle({ barberId: 'bar-1', locationId: 'loc-1' });

    await expect(assign.handle({ barberId: 'bar-1', locationId: 'loc-1' })).rejects.toBeInstanceOf(
      StaffAlreadyAssignedError
    );
  });

  it('локації немає → LocationNotFoundError', async () => {
    const { assign } = setup();
    await expect(assign.handle({ barberId: 'bar-1', locationId: 'nope' })).rejects.toBeInstanceOf(
      LocationNotFoundError
    );
  });

  it('порожній input → InvalidStaffInputError', async () => {
    const { assign } = setup();
    await expect(assign.handle({ barberId: ' ', locationId: 'loc-1' })).rejects.toBeInstanceOf(
      InvalidStaffInputError
    );
  });
});
