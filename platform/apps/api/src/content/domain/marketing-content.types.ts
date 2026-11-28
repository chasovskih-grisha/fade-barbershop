/** Типи контент-плану соцмереж і пороги відбору фото (T-5034). */

export type MarketingChannel = 'instagram' | 'tiktok';

export interface PortfolioPhotoMeta {
  readonly id: string;
  readonly serviceName: string;
  readonly ratingAvg: number;
  readonly width: number;
  readonly height: number;
  readonly consentGranted: boolean;
  readonly takenAt: Date;
}

export type PhotoRejectionReason =
  | 'no_consent'
  | 'low_rating'
  | 'low_resolution'
  | 'duplicate_service'
  | 'missing_caption';

export interface RejectedPhoto {
  readonly photoId: string;
  readonly reason: PhotoRejectionReason;
}

export interface CaptionDraft {
  readonly photoId: string;
  readonly hook: string;
  readonly body: string;
  readonly hashtags: readonly string[];
  readonly callToAction: string;
}

export interface MarketingPost {
  readonly photoId: string;
  readonly channel: MarketingChannel;
  readonly caption: string;
  readonly hashtags: readonly string[];
  readonly callToAction: string;
  readonly scheduledAt: Date;
  readonly requiresApproval: true;
}

export interface ContentPlan {
  readonly posts: readonly MarketingPost[];
  readonly rejected: readonly RejectedPhoto[];
  readonly approvalRequired: true;
}

export const MIN_MARKETING_RATING = 4.5;
export const MIN_MARKETING_EDGE_PX = 1_080;
