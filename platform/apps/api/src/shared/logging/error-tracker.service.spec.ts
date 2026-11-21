import { ErrorTrackerService } from './error-tracker.service';

describe('ErrorTrackerService', () => {
  let tracker: ErrorTrackerService;

  beforeEach(() => {
    tracker = new ErrorTrackerService();
  });

  it('records errors and returns recent snapshot', () => {
    tracker.recordError('AuthModule', 'Unauthorized access attempt', 'at stack trace', 401);
    tracker.recordError('BookingModule', 'Slot already locked', undefined, 409);

    const snapshot = tracker.snapshot();
    expect(snapshot.totalRecorded).toBe(2);
    expect(snapshot?.recentErrors?.[0]?.context).toBe('BookingModule');
    expect(snapshot?.recentErrors?.[0]?.statusCode).toBe(409);
    expect(snapshot?.recentErrors?.[1]?.context).toBe('AuthModule');
    expect(snapshot?.recentErrors?.[1]?.statusCode).toBe(401);
  });

  it('respects maximum capacity of 100 errors', () => {
    for (let i = 0; i < 110; i++) {
      tracker.recordError('TestContext', `Error ${i}`);
    }

    const snapshot = tracker.snapshot();
    expect(snapshot.totalRecorded).toBe(100);
    expect(snapshot?.recentErrors?.[0]?.message).toBe('Error 109');
  });
});
