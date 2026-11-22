import {
  acceptPublicReview,
  issueReviewCredential,
  type ReviewClaim,
  type ReviewSigner,
  type ReviewSubmission,
} from './verified-review';

function weakSignature(payload: string): string {
  let hash = 7;
  for (let index = 0; index < payload.length; index += 1) {
    hash = (hash * 31 + payload.charCodeAt(index)) % 1_000_000_007;
  }
  return `v1:${hash}`;
}

const signer: ReviewSigner = {
  sign: weakSignature,
  verify: (payload, signature) => signature === weakSignature(payload),
};

const completedAt = new Date('2026-11-20T15:00:00Z');

function credential(): ReturnType<typeof issueReviewCredential> {
  const claim: ReviewClaim = {
    reviewId: 'review-1',
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    barberId: 'barber-1',
    locationId: 'location-1',
    rating: 5,
    completedAt,
    issuedAt: new Date('2026-11-20T16:00:00Z'),
  };
  return issueReviewCredential(claim, signer);
}

function submission(overrides: Partial<ReviewSubmission> = {}): ReviewSubmission {
  return {
    reviewId: 'review-1',
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    barberId: 'barber-1',
    locationId: 'location-1',
    rating: 5,
    submittedAt: new Date('2026-11-21T09:00:00Z'),
    ...overrides,
  };
}

describe('acceptPublicReview (T-5031)', () => {
  it('accepts a review that matches every signed claim field', () => {
    expect(acceptPublicReview(submission(), credential(), signer)).toEqual({ valid: true });
  });

  it('rejects mismatched clients, forged credentials and pre-completion submissions', () => {
    expect(acceptPublicReview(submission({ clientId: 'someone-else' }), credential(), signer)).toEqual({
      valid: false,
      reason: 'claim_mismatch:clientId',
    });
    expect(acceptPublicReview(submission({ rating: 1 }), credential(), signer)).toEqual({
      valid: false,
      reason: 'claim_mismatch:rating',
    });
    expect(
      acceptPublicReview(
        submission({ submittedAt: new Date('2026-11-19T00:00:00Z') }),
        credential(),
        signer
      )
    ).toEqual({ valid: false, reason: 'submitted_before_completion' });
    expect(
      acceptPublicReview(submission(), { ...credential(), signature: 'forged' }, signer)
    ).toEqual({ valid: false, reason: 'invalid_signature' });
  });
});
