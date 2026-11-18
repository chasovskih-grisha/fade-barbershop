import { Injectable } from '@nestjs/common';

@Injectable()
export class MessagingService {
  getStatus() {
    return { status: 'ok', context: 'messaging' };
  }
}
