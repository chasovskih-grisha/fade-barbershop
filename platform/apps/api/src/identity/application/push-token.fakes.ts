// Фейк PushTokenRepository (T-070/T-4422) — окремо від ports.fakes.ts за
// LOC-гейтом; поведінка та сама, що в Prisma-адаптера.

import type { PushTokenRepository } from '../domain/ports';
import type { PushToken } from '../domain/push-token';

export class FakePushTokenRepository implements PushTokenRepository {
  private store = new Map<string, PushToken>();

  async findByToken(token: string): Promise<PushToken | null> {
    return [...this.store.values()].find((t) => t.token === token) ?? null;
  }

  async save(token: PushToken): Promise<void> {
    // Токен унікальний глобально: перереєстрація не плодить другий рядок.
    for (const [key, existing] of this.store) {
      if (existing.token === token.token && key !== token.id) this.store.delete(key);
    }
    this.store.set(token.id, token);
  }

  async revokeByToken(token: string, userId: string, at: Date): Promise<boolean> {
    const row = await this.findByToken(token);
    if (!row || row.userId !== userId) return false;
    const changed = row.revoke(at);
    if (changed) await this.save(row);
    return changed;
  }

  get all(): PushToken[] {
    return [...this.store.values()];
  }
}
