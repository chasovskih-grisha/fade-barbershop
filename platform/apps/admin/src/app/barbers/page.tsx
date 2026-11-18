'use client';

import BarbersManager from './BarbersManager';
import { BarbersErrorBoundary } from './BarbersErrorBoundary';

export default function BarbersPage() {
  return (
    <BarbersErrorBoundary>
      <BarbersManager />
    </BarbersErrorBoundary>
  );
}
