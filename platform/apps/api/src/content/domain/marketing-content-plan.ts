/** Social marketing content selection, caption checks and scheduling (T-5034). */

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

const CAPTION_BODY_LIMITS: Record<MarketingChannel, number> = {
  instagram: 2_200,
  tiktok: 300,
};

const MIN_HASHTAGS = 3;
const MAX_HASHTAGS = 10;

function shortEdge(photo: PortfolioPhotoMeta): number {
  return Math.min(photo.width, photo.height);
}

/**
 * Picks eligible completed-visit photos: explicit consent, a high rating,
 * marketing-grade resolution and one post per service (best rated, then newest).
 */
export function selectMarketingPhotos(
  photos: readonly PortfolioPhotoMeta[],
  limit: number
): { selected: PortfolioPhotoMeta[]; rejected: RejectedPhoto[] } {
  const rejected: RejectedPhoto[] = [];
  const eligible: PortfolioPhotoMeta[] = [];
  for (const photo of photos) {
    if (!photo.consentGranted) {
      rejected.push({ photoId: photo.id, reason: 'no_consent' });
      continue;
    }
    if (photo.ratingAvg < MIN_MARKETING_RATING) {
      rejected.push({ photoId: photo.id, reason: 'low_rating' });
      continue;
    }
    if (shortEdge(photo) < MIN_MARKETING_EDGE_PX) {
      rejected.push({ photoId: photo.id, reason: 'low_resolution' });
      continue;
    }
    eligible.push(photo);
  }

  eligible.sort(
    (left, right) =>
      right.ratingAvg - left.ratingAvg || right.takenAt.getTime() - left.takenAt.getTime()
  );

  const selected: PortfolioPhotoMeta[] = [];
  const usedServices = new Set<string>();
  for (const photo of eligible) {
    if (selected.length >= Math.max(0, limit)) break;
    if (usedServices.has(photo.serviceName)) {
      rejected.push({ photoId: photo.id, reason: 'duplicate_service' });
      continue;
    }
    usedServices.add(photo.serviceName);
    selected.push(photo);
  }
  return { selected, rejected };
}

/** Validates an LLM-produced caption before it can be scheduled. */
export function validateCaption(draft: CaptionDraft, channel: MarketingChannel): string[] {
  const issues: string[] = [];
  const hook = draft.hook.trim();
  if (hook.length === 0) issues.push('hook_required');
  if (hook.length > 80) issues.push('hook_too_long');
  if (draft.body.trim().length > CAPTION_BODY_LIMITS[channel]) issues.push('body_too_long');
  if (draft.callToAction.trim().length === 0) issues.push('call_to_action_required');
  if (draft.hashtags.length < MIN_HASHTAGS) issues.push('too_few_hashtags');
  if (draft.hashtags.length > MAX_HASHTAGS) issues.push('too_many_hashtags');
  if (draft.hashtags.some((tag) => !/^#[A-Za-z0-9_]+$/.test(tag))) {
    issues.push('invalid_hashtag');
  }
  return issues;
}

/**
 * Builds a multi-post plan from selected photos and generated captions.
 * Posts are staggered by `cadenceDays` and always require manager approval.
 */
export function buildContentPlan(input: {
  readonly photos: readonly PortfolioPhotoMeta[];
  readonly captions: readonly CaptionDraft[];
  readonly channel: MarketingChannel;
  readonly startAt: Date;
  readonly maxPosts?: number;
  readonly cadenceDays?: number;
}): ContentPlan {
  const { selected, rejected } = selectMarketingPhotos(input.photos, input.maxPosts ?? 5);
  const captions = new Map(input.captions.map((caption) => [caption.photoId, caption]));
  const cadenceDays = Math.max(1, input.cadenceDays ?? 2);
  const posts: MarketingPost[] = [];
  const finalRejected: RejectedPhoto[] = [...rejected];

  for (const [index, photo] of selected.entries()) {
    const caption = captions.get(photo.id);
    if (!caption || validateCaption(caption, input.channel).length > 0) {
      finalRejected.push({ photoId: photo.id, reason: 'missing_caption' });
      continue;
    }
    posts.push({
      photoId: photo.id,
      channel: input.channel,
      caption: `${caption.hook.trim()}\n\n${caption.body.trim()}`,
      hashtags: caption.hashtags,
      callToAction: caption.callToAction.trim(),
      scheduledAt: new Date(input.startAt.getTime() + index * cadenceDays * 86_400_000),
      requiresApproval: true,
    });
  }

  return { posts, rejected: finalRejected, approvalRequired: true };
}
