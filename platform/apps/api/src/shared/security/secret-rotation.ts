/** Zero-trust credential rotation planning (T-5026). */

const DAY_MS = 86_400_000;

export interface SecretDescriptor {
  readonly name: string;
  readonly owner: string;
  readonly lastRotatedAt: Date;
  readonly rotationIntervalDays: number;
}

export interface RotationPlan {
  readonly due: readonly SecretDescriptor[];
  readonly upcoming: readonly SecretDescriptor[];
  readonly nextRotationAt: Date | undefined;
}

export type RotationPhase = 'stage' | 'activate' | 'retire';

export interface RotationStep {
  readonly phase: RotationPhase;
  readonly secretName: string;
  readonly executeAt: Date;
  readonly reason: string;
}

export function nextRotationAt(secret: SecretDescriptor): Date {
  return new Date(
    secret.lastRotatedAt.getTime() + secret.rotationIntervalDays * DAY_MS
  );
}

export function daysUntilRotation(secret: SecretDescriptor, now: Date): number {
  return Math.ceil((nextRotationAt(secret).getTime() - now.getTime()) / DAY_MS);
}

/** Splits secrets into overdue and those entering the planning horizon. */
export function planRotation(
  secrets: readonly SecretDescriptor[],
  now: Date,
  horizonDays = 7
): RotationPlan {
  const due = secrets.filter((secret) => daysUntilRotation(secret, now) <= 0);
  const upcoming = secrets.filter((secret) => {
    const days = daysUntilRotation(secret, now);
    return days > 0 && days <= horizonDays;
  });
  const next = secrets
    .map(nextRotationAt)
    .sort((left, right) => left.getTime() - right.getTime())[0];
  return { due, upcoming, nextRotationAt: next };
}

/**
 * Two-phase reload: the new credential is staged while the old one still
 * serves traffic, then activated, then the old one is retired. No downtime and
 * no request ever sees an empty credential slot.
 */
export function buildZeroDowntimeRotation(
  secret: SecretDescriptor,
  now: Date,
  overlapMinutes = 15
): RotationStep[] {
  const activateAt = new Date(now.getTime() + overlapMinutes * 60_000);
  const retireAt = new Date(now.getTime() + overlapMinutes * 2 * 60_000);
  return [
    { phase: 'stage', secretName: secret.name, executeAt: now, reason: 'publish new version in vault' },
    { phase: 'activate', secretName: secret.name, executeAt: activateAt, reason: 'reload consumers, new version live' },
    { phase: 'retire', secretName: secret.name, executeAt: retireAt, reason: 'revoke previous version' },
  ];
}
