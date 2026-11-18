export interface BookingInterval {
  start: Date;
  end: Date;
}

export interface ChairCapacityInput {
  existing: BookingInterval[];
  start: Date;
  end: Date;
  chairs: number;
}

/** Returns whether one additional booking fits in the location's active chairs. */
export function hasChairCapacity({ existing, start, end, chairs }: ChairCapacityInput): boolean {
  if (!Number.isInteger(chairs) || chairs < 1 || end <= start) return false;
  const events: Array<{ at: number; delta: number }> = [];
  for (const booking of existing) {
    if (booking.start >= end || booking.end <= start) continue;
    events.push({ at: Math.max(start.getTime(), booking.start.getTime()), delta: 1 });
    events.push({ at: Math.min(end.getTime(), booking.end.getTime()), delta: -1 });
  }
  events.push({ at: start.getTime(), delta: 1 });
  events.push({ at: end.getTime(), delta: -1 });
  // At equal times, ending bookings free chairs before new bookings begin.
  events.sort((left, right) => left.at - right.at || left.delta - right.delta);
  let occupied = 0;
  for (const event of events) {
    occupied += event.delta;
    if (occupied > chairs) return false;
  }
  return true;
}
