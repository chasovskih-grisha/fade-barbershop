/** Перевірка підпису, згенерованого LLM, перед плануванням (T-5034). */
import type { CaptionDraft, MarketingChannel } from './marketing-content.types';

const CAPTION_BODY_LIMITS: Record<MarketingChannel, number> = {
  instagram: 2_200,
  tiktok: 300,
};

const MIN_HASHTAGS = 3;
const MAX_HASHTAGS = 10;
const MAX_HOOK_LENGTH = 80;
const HASHTAG_FORMAT = /^#[A-Za-z0-9_]+$/;

/** Validates an LLM-produced caption before it can be scheduled. */
export function validateCaption(draft: CaptionDraft, channel: MarketingChannel): string[] {
  const issues: string[] = [];
  const hook = draft.hook.trim();
  if (hook.length === 0) issues.push('hook_required');
  if (hook.length > MAX_HOOK_LENGTH) issues.push('hook_too_long');
  if (draft.body.trim().length > CAPTION_BODY_LIMITS[channel]) issues.push('body_too_long');
  if (draft.callToAction.trim().length === 0) issues.push('call_to_action_required');
  if (draft.hashtags.length < MIN_HASHTAGS) issues.push('too_few_hashtags');
  if (draft.hashtags.length > MAX_HASHTAGS) issues.push('too_many_hashtags');
  if (draft.hashtags.some((tag) => !HASHTAG_FORMAT.test(tag))) issues.push('invalid_hashtag');
  return issues;
}
