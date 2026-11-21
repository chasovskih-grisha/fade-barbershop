import { getStoredUtmParams, trackEvent } from './analytics-core';

function setAmplitudeUserId(userId: string | null): void {
  if (
    typeof window !== 'undefined' &&
    window.amplitude &&
    typeof window.amplitude.setUserId === 'function'
  ) {
    window.amplitude.setUserId(userId);
  }
}

export const authAnalytics = {
  phoneSubmitted: (phoneE164Hash: string, isNewUser?: boolean) => {
    trackEvent('auth_phone_submitted', {
      phone_e164_hash: phoneE164Hash,
      is_new_user: isNewUser ?? false,
      ...getStoredUtmParams(),
    });
  },
  otpSubmitted: (attemptNumber: number, codeLength: number) => {
    trackEvent('auth_otp_submitted', {
      attempt_number: attemptNumber,
      code_length: codeLength,
    });
  },
  otpVerified: (userId: string, isNewUser: boolean, role: 'client' | 'barber' | 'admin') => {
    trackEvent('auth_otp_verified', {
      user_id: userId,
      is_new_user: isNewUser,
      role,
    });
    setAmplitudeUserId(userId);
  },
  otpFailed: (errorCode: string, attemptNumber: number) => {
    trackEvent('auth_otp_failed', {
      error_code: errorCode,
      attempt_number: attemptNumber,
    });
  },
  otpResent: (resendCount: number) => {
    trackEvent('auth_otp_resent', {
      resend_count: resendCount,
    });
  },
  logout: (userId?: string) => {
    trackEvent('auth_logout', {
      user_id: userId || '',
    });
    setAmplitudeUserId(null);
  },
};
