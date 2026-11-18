import { biometricsService } from './biometrics';

describe('biometricsService', () => {
  beforeEach(async () => {
    biometricsService._setMockState(true, true);
    await biometricsService.invalidate();
  });

  it('checks hardware and enrollment', async () => {
    expect(await biometricsService.hasHardwareAsync()).toBe(true);
    expect(await biometricsService.isEnrolledAsync()).toBe(true);
  });

  it('manages biometric toggle and secure token', async () => {
    expect(await biometricsService.getBiometricEnabled()).toBe(false);
    expect(await biometricsService.getSecureToken()).toBeNull();

    await biometricsService.setBiometricEnabled(true, 'secret-refresh-token-123');
    expect(await biometricsService.getBiometricEnabled()).toBe(true);
    expect(await biometricsService.getSecureToken()).toBe('secret-refresh-token-123');

    const auth = await biometricsService.authenticateAsync();
    expect(auth.success).toBe(true);

    await biometricsService.invalidate();
    expect(await biometricsService.getBiometricEnabled()).toBe(false);
    expect(await biometricsService.getSecureToken()).toBeNull();
  });

  it('handles missing hardware gracefully', async () => {
    biometricsService._setMockState(false, false);
    const auth = await biometricsService.authenticateAsync();
    expect(auth.success).toBe(false);
    expect(auth.error).toBe('NOT_AVAILABLE');
  });
});
