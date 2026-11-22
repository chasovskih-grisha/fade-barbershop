import {
  buildContentPlan,
  selectMarketingPhotos,
  validateCaption,
  type CaptionDraft,
  type PortfolioPhotoMeta,
} from './marketing-content-plan';

function photo(overrides: Partial<PortfolioPhotoMeta> & { id: string }): PortfolioPhotoMeta {
  return {
    serviceName: 'Skin fade',
    ratingAvg: 5,
    width: 1_600,
    height: 1_200,
    consentGranted: true,
    takenAt: new Date('2026-11-01T10:00:00Z'),
    ...overrides,
  };
}

function caption(photoId: string, overrides: Partial<CaptionDraft> = {}): CaptionDraft {
  return {
    photoId,
    hook: 'Fresh fade Friday',
    body: 'Clean lines and a sharp finish.',
    hashtags: ['#fade', '#barbershop', '#freshtrim'],
    callToAction: 'Book your chair today.',
    ...overrides,
  };
}

describe('marketing photo selection (T-5034)', () => {
  it('filters consent, rating and resolution', () => {
    const { selected, rejected } = selectMarketingPhotos(
      [
        photo({ id: 'ok' }),
        photo({ id: 'no-consent', consentGranted: false }),
        photo({ id: 'low-rating', ratingAvg: 4.2 }),
        photo({ id: 'low-res', width: 900, height: 900 }),
      ],
      5
    );
    expect(selected.map((item) => item.id)).toEqual(['ok']);
    expect(rejected).toEqual([
      { photoId: 'no-consent', reason: 'no_consent' },
      { photoId: 'low-rating', reason: 'low_rating' },
      { photoId: 'low-res', reason: 'low_resolution' },
    ]);
  });

  it('keeps one best photo per service and respects the limit', () => {
    const { selected, rejected } = selectMarketingPhotos(
      [
        photo({ id: 'fade-old', ratingAvg: 4.8, serviceName: 'Fade', takenAt: new Date('2026-10-01T00:00:00Z') }),
        photo({ id: 'fade-new', ratingAvg: 5, serviceName: 'Fade', takenAt: new Date('2026-11-01T00:00:00Z') }),
        photo({ id: 'beard', ratingAvg: 4.9, serviceName: 'Beard trim' }),
        photo({ id: 'kids', ratingAvg: 4.7, serviceName: 'Kids cut' }),
      ],
      3
    );
    expect(selected.map((item) => item.id)).toEqual(['fade-new', 'beard', 'kids']);
    expect(rejected).toContainEqual({ photoId: 'fade-old', reason: 'duplicate_service' });
  });
});

describe('caption validation and content plan (T-5034)', () => {
  it('accepts a compliant caption and flags channel/length problems', () => {
    expect(validateCaption(caption('p1'), 'instagram')).toEqual([]);
    expect(
      validateCaption(
        caption('p1', {
          hook: '',
          hashtags: ['#one', 'bad tag'],
          callToAction: '',
          body: 'x'.repeat(301),
        }),
        'tiktok'
      )
    ).toEqual([
      'hook_required',
      'body_too_long',
      'call_to_action_required',
      'too_few_hashtags',
      'invalid_hashtag',
    ]);
  });

  it('builds staggered posts with approval and rejects photos without captions', () => {
    const startAt = new Date('2026-11-24T09:00:00Z');
    const plan = buildContentPlan({
      photos: [photo({ id: 'p1' }), photo({ id: 'p2', serviceName: 'Beard trim' })],
      captions: [caption('p1')],
      channel: 'instagram',
      startAt,
      cadenceDays: 3,
    });

    expect(plan.approvalRequired).toBe(true);
    expect(plan.posts).toHaveLength(1);
    expect(plan.posts[0]?.photoId).toBe('p1');
    expect(plan.posts[0]?.scheduledAt).toEqual(startAt);
    expect(plan.posts[0]?.caption).toContain('Fresh fade Friday');
    expect(plan.rejected).toEqual([{ photoId: 'p2', reason: 'missing_caption' }]);
  });
});
