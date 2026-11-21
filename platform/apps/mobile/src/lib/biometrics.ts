/**
 * Biometric authentication & Keychain storage helper for T-4426.
 * Simulates React Native LocalAuthentication and SecureStore / Keychain.
 */

let mockHasHardware = true;
let mockIsEnrolled = true;
let mockBiometricEnabled = false;
let mockSecureToken: string | null = null;

export const biometricsService = {
  async hasHardwareAsync(): Promise<boolean> {
    return mockHasHardware;
  },
  async isEnrolledAsync(): Promise<boolean> {
    return mockIsEnrolled;
  },
  async authenticateAsync(
    _promptMessage = 'Підтвердіть особу'
  ): Promise<{ success: boolean; error?: string }> {
    if (!mockHasHardware || !mockIsEnrolled) {
      return { success: false, error: 'NOT_AVAILABLE' };
    }
    // In test or runtime environment, simulate successful biometric validation
    return { success: true };
  },
  async getBiometricEnabled(): Promise<boolean> {
    return mockBiometricEnabled;
  },
  async setBiometricEnabled(enabled: boolean, token?: string): Promise<void> {
    mockBiometricEnabled = enabled;
    if (enabled && token) {
      mockSecureToken = token;
    } else if (!enabled) {
      mockSecureToken = null;
    }
  },
  async getSecureToken(): Promise<string | null> {
    return mockSecureToken;
  },
  async invalidate(): Promise<void> {
    mockBiometricEnabled = false;
    mockSecureToken = null;
  },
  // Test helpers
  _setMockState(hardware: boolean, enrolled: boolean) {
    mockHasHardware = hardware;
    mockIsEnrolled = enrolled;
  },
};
