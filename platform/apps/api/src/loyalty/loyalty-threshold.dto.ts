import { IdempotencyKey } from '../shared/decorators/idempotency-key.decorator';

/** Вхідні дані адміністратора для зміни порога лояльності (LYL-ADM-01). */
export class SetThresholdInput {
  @IdempotencyKey()
  threshold: number;
  adminId: string;
}

/** Відповідь на зміну порога лояльності. */
export class ThresholdOutput {
  success: boolean;
  data: {
    threshold: number;
    adminId: string;
    timestamp: string;
  };
}
