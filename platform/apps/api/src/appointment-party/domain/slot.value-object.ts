// Slot – time window for an appointment leg (value object).

export class Slot {
  private constructor(private readonly data: { start: Date; end: Date }) {}

  static create(start: Date, end: Date): Slot {
    if (end <= start) {
      throw new Error('Slot end must be after start');
    }
    return new Slot({ start, end });
  }

  get start(): Date {
    return this.data.start;
  }

  get end(): Date {
    return this.data.end;
  }

  // Duration in minutes.
  get durationMinutes(): number {
    return (this.data.end.getTime() - this.data.start.getTime()) / 60000;
  }
}
