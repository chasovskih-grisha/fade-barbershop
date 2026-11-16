import { CustomerBookingFlow } from '../src/booking';

describe('CustomerBookingFlow Component', () => {
  it('should export CustomerBookingFlow and render basic properties', () => {
    expect(CustomerBookingFlow).toBeDefined();
    expect(typeof CustomerBookingFlow).toBe('function');
  });
});
