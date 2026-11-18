import {
  InvalidTimeBlockError,
  blocksSlot,
  createTimeBlock,
  excludeBlockedSlots,
  hasTimeBlockOverlap,
  type TimeBlockData,
} from './time-block';

const block = (over: Partial<TimeBlockData> = {}): TimeBlockData => ({
  id: '0190f1c2-0000-7000-8000-0000000000b1',
  barberId: '0190f1c2-0000-7000-8000-0000000000a1',
  locationId: '0190f1c2-0000-7000-8000-0000000000c1',
  start: '13:00',
  end: '14:00',
  reason: 'Обід',
  createdBy: '0190f1c2-0000-7000-8000-0000000000d1',
  ...over,
});

describe('time blocks (T-4420)', () => {
  it('rejects a block without a reason', () => {
    expect(() => createTimeBlock(block({ reason: '  ' }), 15)).toThrow(InvalidTimeBlockError);
  });

  it('rejects a block shorter than the minimum slot interval', () => {
    expect(() => createTimeBlock(block({ start: '13:00', end: '13:10' }), 15)).toThrow(
      /shorter than the minimum/
    );
  });

  it('rejects a block whose end is not after its start', () => {
    expect(() => createTimeBlock(block({ start: '14:00', end: '14:00' }), 15)).toThrow(
      /End must be after start/
    );
  });

  it('accepts a block that meets the minimum interval', () => {
    expect(createTimeBlock(block({ start: '13:00', end: '13:15' }), 15)).toEqual(
      block({ start: '13:00', end: '13:15' })
    );
  });

  it('treats a slot touching a block edge as free', () => {
    expect(blocksSlot(block(), { start: '12:30', end: '13:00' })).toBe(false);
    expect(blocksSlot(block(), { start: '14:00', end: '14:30' })).toBe(false);
  });

  it('treats an overlapping slot as blocked', () => {
    expect(blocksSlot(block(), { start: '13:30', end: '14:30' })).toBe(true);
    expect(blocksSlot(block(), { start: '12:30', end: '13:30' })).toBe(true);
    expect(blocksSlot(block(), { start: '13:15', end: '13:45' })).toBe(true);
  });

  it('drops every slot that falls inside a block', () => {
    const slots = [
      { start: '12:30', end: '13:00' },
      { start: '13:00', end: '13:30' },
      { start: '13:30', end: '14:00' },
      { start: '14:00', end: '14:30' },
    ];
    expect(excludeBlockedSlots(slots, [block()])).toEqual([
      { start: '12:30', end: '13:00' },
      { start: '14:00', end: '14:30' },
    ]);
  });
});

describe('time block overlap (T-4420)', () => {
  it('detects an overlapping block for the same barber and location', () => {
    const existing = block({ id: 'b-1' });
    const candidate = block({ id: 'b-2', start: '13:30', end: '14:30' });
    expect(hasTimeBlockOverlap([existing], candidate)).toBe(true);
  });

  it('allows a block that touches the edge of another', () => {
    const existing = block({ id: 'b-1' });
    const after = block({ id: 'b-2', start: '14:00', end: '15:00' });
    expect(hasTimeBlockOverlap([existing], after)).toBe(false);
  });

  it('allows the same interval for a different barber or location', () => {
    const existing = block({ id: 'b-1' });
    expect(hasTimeBlockOverlap([existing], block({ id: 'b-2', barberId: 'other-barber' }))).toBe(
      false
    );
    expect(
      hasTimeBlockOverlap([existing], block({ id: 'b-3', locationId: 'other-location' }))
    ).toBe(false);
  });

  it('does not report a block as overlapping itself on re-save', () => {
    const existing = block({ id: 'b-1' });
    expect(hasTimeBlockOverlap([existing], block({ id: 'b-1' }))).toBe(false);
  });
});
