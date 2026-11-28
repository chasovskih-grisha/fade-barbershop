/** Social marketing content selection, caption checks and scheduling (T-5034).
 *
 * Публічний шлях модуля: типи — marketing-content.types.ts, відбір фото —
 * marketing-content-selection.ts, перевірка підпису — marketing-content-caption.ts,
 * а побудова плану лишається тут.
 */
import { selectMarketingPhotos } from './marketing-content-selection';
import { validateCaption } from './marketing-content-caption';
import type {
  CaptionDraft,
  ContentPlan,
  MarketingChannel,
  MarketingPost,
  PortfolioPhotoMeta,
  RejectedPhoto,
} from './marketing-content.types';

export { selectMarketingPhotos, validateCaption };
export type {
  CaptionDraft,
  ContentPlan,
  MarketingChannel,
  MarketingPost,
  PhotoRejectionReason,
  PortfolioPhotoMeta,
  RejectedPhoto,
} from './marketing-content.types';
export { MIN_MARKETING_EDGE_PX, MIN_MARKETING_RATING } from './marketing-content.types';

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
