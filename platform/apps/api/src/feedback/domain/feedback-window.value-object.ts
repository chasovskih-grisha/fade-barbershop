export class FeedbackWindow {
  constructor(
    public readonly appointmentCompletedAt: Date,
    public readonly windowDays: number = 30,
  ) {}

  get windowEndsAt(): Date {
    const ends = new Date(this.appointmentCompletedAt);
    ends.setDate(ends.getDate() + this.windowDays);
    return ends;
  }

  isOpen(now: Date = new Date()): boolean {
    return now >= this.appointmentCompletedAt && now <= this.windowEndsAt;
  }
}
