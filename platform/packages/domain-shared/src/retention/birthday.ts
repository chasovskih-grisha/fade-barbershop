import type { ClientBirthdayAnniversaryRequest, ClientBirthdayAnniversaryResult } from './types';

function resolveAnniversaryCredit(eligible: boolean, membershipMonths: number): number {
  if (!eligible) return 0;
  if (membershipMonths >= 24) return 500;
  if (membershipMonths >= 12) return 250;
  return 100;
}

function buildPerks(
  request: ClientBirthdayAnniversaryRequest,
  anniversaryCredit: number,
  vipConcierge: boolean
): string[] {
  const perks = ['Complimentary beverage'];
  if (request.isBirthdayMonth) {
    perks.push('Free Professional Beard Grooming or Scalp Treatment');
  }
  if (request.isAnniversaryMonth) {
    perks.push(`Anniversary Credit Voucher (${anniversaryCredit} UAH)`);
  }
  if (vipConcierge) {
    perks.push('Dedicated VIP Concierge Booking Line');
  }
  return perks;
}

/**
 * Calculate client birthday and account anniversary VIP retention incentive package.
 */
export function calculateBirthdayAnniversaryIncentive(
  request: ClientBirthdayAnniversaryRequest
): ClientBirthdayAnniversaryResult {
  const birthdayVoucherCode = request.isBirthdayMonth
    ? `BDAY-${request.clientId.slice(0, 6).toUpperCase()}-25`
    : '';
  const anniversaryBonusCreditUah = resolveAnniversaryCredit(
    request.isAnniversaryMonth,
    request.membershipMonths
  );
  const vipConciergeUnlocked = request.totalVisits >= 10 || request.membershipMonths >= 12;

  return {
    clientId: request.clientId,
    eligibleForBirthdayBonus: request.isBirthdayMonth,
    eligibleForAnniversaryBonus: request.isAnniversaryMonth,
    birthdayVoucherCode,
    anniversaryBonusCreditUah,
    vipConciergeUnlocked,
    recommendedPerks: buildPerks(request, anniversaryBonusCreditUah, vipConciergeUnlocked),
  };
}
