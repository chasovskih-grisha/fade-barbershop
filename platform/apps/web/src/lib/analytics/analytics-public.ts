import { getStoredUtmParams, trackEvent } from './analytics-core';

export interface ServiceViewParams {
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
  locationCode?: string;
}

export const publicPageAnalytics = {
  pageView: (pageName: string, pagePath: string, locationCode?: string) => {
    trackEvent('page_view', {
      page_name: pageName,
      page_path: pagePath,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      location_code: locationCode || '',
      ...getStoredUtmParams(),
    });
  },
  ctaBookingClick: (ctaLocation: string, locationCode?: string) => {
    trackEvent('cta_booking_click', {
      cta_location: ctaLocation,
      location_code: locationCode || '',
      ...getStoredUtmParams(),
    });
  },
  locationSelect: (locationCode: string, locationName: string) => {
    trackEvent('location_select', { location_code: locationCode, location_name: locationName });
  },
  serviceView: (params: ServiceViewParams) => {
    trackEvent('service_view', {
      service_id: params.serviceId,
      service_name: params.serviceName,
      price: params.price,
      duration_minutes: params.durationMinutes,
      location_code: params.locationCode || '',
    });
  },
  barberView: (barberId: string, barberName: string, locationCode?: string) => {
    trackEvent('barber_view', {
      barber_id: barberId,
      barber_name: barberName,
      location_code: locationCode || '',
    });
  },
  articleView: (articleSlug: string, articleTag?: string) => {
    trackEvent('article_view', {
      article_slug: articleSlug,
      ...(articleTag ? { article_tag: articleTag } : {}),
    });
  },
  phoneClick: (phoneNumber: string, pagePath: string) => {
    trackEvent('phone_click', { phone_number: phoneNumber, page_path: pagePath });
  },
};

export const giftCertificatesAnalytics = {
  viewed: (locationCode?: string) => {
    trackEvent('gift_certificate_viewed', { location_code: locationCode || '' });
  },
  selected: (amount: number, designId: string) => {
    trackEvent('gift_certificate_selected', { amount, design_id: designId });
  },
  purchased: (certificateId: string, amount: number, recipientEmailHash?: string) => {
    trackEvent('gift_certificate_purchased', {
      certificate_id: certificateId,
      amount,
      recipient_email_hash: recipientEmailHash || '',
    });
  },
  redeemed: (certificateId: string, amount: number, bookingId?: string) => {
    trackEvent('gift_certificate_redeemed', {
      certificate_id: certificateId,
      amount,
      booking_id: bookingId || '',
    });
  },
};

export const referralAnalytics = {
  codeCopied: (referralCode: string) => {
    trackEvent('referral_code_copied', { referral_code: referralCode });
  },
  shared: (channel: 'telegram' | 'viber' | 'whatsapp' | 'copy' | 'qr') => {
    trackEvent('referral_shared', { channel });
  },
  rewardClaimed: (rewardId: string, value: number) => {
    trackEvent('referral_reward_claimed', { reward_id: rewardId, value });
  },
};
