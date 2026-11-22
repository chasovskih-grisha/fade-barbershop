import {
  canonicalClaim,
  issueReviewCredential,
  verifyReviewCredential,
  type ReviewClaim,
  type ReviewSigner,
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

function claim(overrides: Partial<ReviewClaim> = {}): ReviewClaim {
  return {
    reviewId: 'review-1',
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    barberId: 'barber-1',
    locationId: 'location-1',
    rating: 5,
    completedAt: new Date('2026-11-20T15:00:00Z'),
    issuedAt: new Date('2026-11-20T16:00:00Z'),
    ...overrides,
  };
}

describe('issueReviewCredential (T-5031)', () => {
  it('signs a canonical claim that verifies with the same signer', () => {
    const credential = issueReviewCredential(claim(), signer);
    expect(credential.version).toBe(1);
    expect(credential.signature).toBe(weakSignature(canonicalClaim(claim())));
    expect(verifyReviewCredential(credential, signer)).toEqual({ valid: true });
  });

  it('rejects invalid ratings and issuance before completion', () => {
    expect(() => issueReviewCredential(claim({ rating: 6 }), signer)).toThrow(/1 to 5/);
    expect(() => issueReviewCredential(claim({ rating: 4.5 }), signer)).toThrow(/1 to 5/);
    expect(() =>
      issueReviewCredential(claim({ issuedAt: new Date('2026-11-19T00:00:00Z') }), signer)
    ).toThrow(/before appointment completion/);
  });
});

describe('verifyReviewCredential (T-5031)', () => {
  it('rejects tampered claims, unsupported versions and forged signatures', () => {
    const credential = issueReviewCredential(claim(), signer);

    expect(
      verifyReviewCredential({ ...credential, claim: { ...credential.claim, rating: 1 } }, signer)
    ).toEqual({ valid: false, reason: 'invalid_signature' });
    expect(verifyReviewCredential({ ...credential, version: 2 as never }, signer)).toEqual({
      valid: false,
      reason: 'unsupported_credential_version',
    });
    expect(verifyReviewCredential({ ...credential, signature: 'forged' }, signer)).toEqual({
      valid: false,
      reason: 'invalid_signature',
    });
    expect(
      verifyReviewCredential(
        {
          ...credential,
          claim: { ...credential.claim, issuedAt: new Date('2026-11-19T00:00:00Z') },
        },
        signer
      )
    ).toEqual({ valid: false, reason: 'issued_before_completion' });
  });
});
