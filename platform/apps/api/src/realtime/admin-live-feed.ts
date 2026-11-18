// In-process шина живих подій адмінки: релей outbox публікує, SSE-контролер
// роздає кожному підключеному клієнту. Свідомо ефемерна: пропущена подія не
// втрачає дані — клієнт перечитує екран із API, а не патчить його з події.
import { Injectable } from '@nestjs/common';
import { Subject, type Observable } from 'rxjs';
import type { AdminLiveNotice } from './admin-live-types';

@Injectable()
export class AdminLiveFeed {
  private readonly subject = new Subject<AdminLiveNotice>();

  /** Потік подій для SSE; кожен підписник — окремий клієнт. */
  get stream$(): Observable<AdminLiveNotice> {
    return this.subject.asObservable();
  }

  publish(notice: AdminLiveNotice): void {
    this.subject.next(notice);
  }
}
