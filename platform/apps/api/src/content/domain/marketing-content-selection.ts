/** Відбір фото портфоліо для маркетингу (T-5034): згода, рейтинг, роздільність
 * і одне фото на послугу. */
import {
  MIN_MARKETING_EDGE_PX,
  MIN_MARKETING_RATING,
  type PhotoRejectionReason,
  type PortfolioPhotoMeta,
  type RejectedPhoto,
} from './marketing-content.types';

function shortEdge(photo: PortfolioPhotoMeta): number {
  return Math.min(photo.width, photo.height);
}

/** Перша причина, з якої фото не можна публікувати; null — фото придатне. */
function ineligibilityReason(photo: PortfolioPhotoMeta): PhotoRejectionReason | null {
  if (!photo.consentGranted) return 'no_consent';
  if (photo.ratingAvg < MIN_MARKETING_RATING) return 'low_rating';
  if (shortEdge(photo) < MIN_MARKETING_EDGE_PX) return 'low_resolution';
  return null;
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
    const reason = ineligibilityReason(photo);
    if (reason) {
      rejected.push({ photoId: photo.id, reason });
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
