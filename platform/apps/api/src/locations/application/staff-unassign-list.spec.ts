import { AssignStaffHandler } from './assign-staff';
import { UnassignStaffHandler } from './unassign-staff';
import { ListStaffHandler } from './list-staff';
import { FakeClock, FakeLocationRepository, FakeOutbox, FakeStaffAssignmentRepository, SeqIds, passthroughUow } from './ports.fakes';
import { StaffAssignmentNotFoundError, InvalidStaffInputError } from './staff-errors';
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
  const unassign = new UnassignStaffHandler({ assignments, outbox, clock, uow: passthroughUow });
  const list = new ListStaffHandler(assignments);
  return { assign, unassign, list, assignments, locations, outbox };
}

describe('UnassignStaffHandler', () => {
  it('знімає барбера + подія StaffUnassigned', async () => {
    const { assign, unassign, assignments, outbox, locations } = setup();
    locations.save(createLocation({ id: 'loc-1' }));
    const { id } = await assign.handle({ barberId: 'bar-1', locationId: 'loc-1' });

    await unassign.handle(id);

    expect(await assignments.findById(id)).toBeNull();
    expect(outbox.events.map((e) => e.type)).toEqual([
      'locations.staff.assigned',
      'locations.staff.unassigned',
    ]);
  });

  it('призначення немає → StaffAssignmentNotFoundError', async () => {
    const { unassign } = setup();
    await expect(unassign.handle('nope')).rejects.toBeInstanceOf(StaffAssignmentNotFoundError);
  });

  it('відхиляє порожній id', async () => {
    const { unassign } = setup();
    await expect(unassign.handle('  ')).rejects.toBeInstanceOf(InvalidStaffInputError);
  });
});

describe('ListStaffHandler', () => {
  it('listByLocation повертає призначення локації', async () => {
    const { assign, list, locations } = setup();
    locations.save(createLocation({ id: 'loc-1' }));
    await assign.handle({ barberId: 'bar-1', locationId: 'loc-1' });

    const all = await list.listByLocation('loc-1');
    expect(all.map((a) => a.barberId)).toEqual(['bar-1']);
  });

  it('listByBarber повертає локації барбера', async () => {
    const { assign, list, locations } = setup();
    locations.save(createLocation({ id: 'loc-1' }));
    await assign.handle({ barberId: 'bar-1', locationId: 'loc-1' });

    const all = await list.listByBarber('bar-1');
    expect(all.map((a) => a.locationId)).toEqual(['loc-1']);
  });
});
