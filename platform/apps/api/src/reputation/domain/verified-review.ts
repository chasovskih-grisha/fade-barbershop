/**
 * Cryptographic verified-review credentials (T-5031).
 * A completed appointment issues a signed claim; public reviews are accepted
 * only when the signature verifies and every claim field matches the review.
 * Signing is a port so the domain stays free of key storage and crypto APIs.
 */

export interface ReviewSigner {
  sign(payload: string): string;
  verify(payload: string, signature: string): boolean;
}

export interface ReviewClaim {
  readonly reviewId: string;
  readonly appointmentId: string;
  readonly clientId: string;
  readonly barberId: string;
  readonly locationId: string;
  readonly rating: number;
  readonly completedAt: Date;
  readonly issuedAt: Date;
}

export interface SignedReviewCredential {
  readonly version: 1;
  readonly claim: ReviewClaim;
  readonly signature: string;
}

export interface ReviewSubmission {
  readonly reviewId: string;
  readonly appointmentId: string;
  readonly clientId: string;
  readonly barberId: string;
  readonly locationId: string;
  readonly rating: number;
  readonly submittedAt: Date;
}

export interface VerificationResult {
  readonly valid: boolean;
  readonly reason?: string;
}

function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/** Field order is fixed so signatures survive JSON round-trips. */
export function canonicalClaim(claim: ReviewClaim): string {
  return JSON.stringify({
    reviewId: claim.reviewId,
    appointmentId: claim.appointmentId,
    clientId: claim.clientId,
    barberId: claim.barberId,
    locationId: claim.locationId,
    rating: claim.rating,
    completedAt: claim.completedAt.toISOString(),
    issuedAt: claim.issuedAt.toISOString(),
  });
}

export function issueReviewCredential(
  claim: ReviewClaim,
  signer: ReviewSigner
): SignedReviewCredential {
  if (!isValidRating(claim.rating)) {
    throw new Error('Rating must be an integer from 1 to 5');
  }
  if (claim.issuedAt.getTime() < claim.completedAt.getTime()) {
    throw new Error('Credential cannot be issued before appointment completion');
  }
  return { version: 1, claim: { ...claim }, signature: signer.sign(canonicalClaim(claim)) };
}

export function verifyReviewCredential(
  credential: SignedReviewCredential,
  signer: ReviewSigner
): VerificationResult {
  const { claim } = credential;
  if (credential.version !== 1) {
    return { valid: false, reason: 'unsupported_credential_version' };
  }
  if (!isValidRating(claim.rating)) {
    return { valid: false, reason: 'invalid_rating' };
  }
  if (claim.issuedAt.getTime() < claim.completedAt.getTime()) {
    return { valid: false, reason: 'issued_before_completion' };
  }
  const signatureValid = signer.verify(canonicalClaim(claim), credential.signature);
  return signatureValid ? { valid: true } : { valid: false, reason: 'invalid_signature' };
}

/** Anti-tamper gate for public review submission. */
export function acceptPublicReview(
  submission: ReviewSubmission,
  credential: SignedReviewCredential,
  signer: ReviewSigner
): VerificationResult {
  const verified = verifyReviewCredential(credential, signer);
  if (!verified.valid) return verified;

  const claim = credential.claim;
  const fields = ['reviewId', 'appointmentId', 'clientId', 'barberId', 'locationId', 'rating'] as const;
  const mismatched = fields.find((field) => claim[field] !== submission[field]);
  if (mismatched) return { valid: false, reason: `claim_mismatch:${mismatched}` };
  if (submission.submittedAt.getTime() < claim.completedAt.getTime()) {
    return { valid: false, reason: 'submitted_before_completion' };
  }
  return { valid: true };
}
