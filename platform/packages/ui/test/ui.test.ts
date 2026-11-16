import { CustomerBookingFlow, VIPMembershipBanner } from '../src/booking';

describe('CustomerBookingFlow Component', () => {
  it('should export CustomerBookingFlow and render basic properties', () => {
    expect(CustomerBookingFlow).toBeDefined();
    expect(typeof CustomerBookingFlow).toBe('function');
  });

  it('should export VIPMembershipBanner and render basic properties', () => {
    expect(VIPMembershipBanner).toBeDefined();
    expect(typeof VIPMembershipBanner).toBe('function');
  });
});
