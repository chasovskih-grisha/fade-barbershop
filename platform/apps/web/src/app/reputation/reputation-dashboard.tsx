'use client';

import { useState } from 'react';
import type { ReputationTab } from './reputation-data';
import { ReputationHeader } from './ReputationHeader';
import { ReputationTabs } from './ReputationTabs';
import { ReputationBenchmarks } from './ReputationBenchmarks';
import { ReputationReviews } from './ReputationReviews';
import { ReputationCompetitive } from './ReputationCompetitive';
import { ReputationTopics } from './ReputationTopics';
import { TestimonialModal } from './TestimonialModal';

export function ReputationDashboard() {
  const [activeTab, setActiveTab] = useState<ReputationTab>('benchmarks');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
      <ReputationHeader />

      <ReputationTabs
        activeTab={activeTab}
        onTab={setActiveTab}
        onWriteReview={() => setTestimonialModalOpen(true)}
      />

      {activeTab === 'benchmarks' && <ReputationBenchmarks />}
      {activeTab === 'reviews' && (
        <ReputationReviews filterRating={filterRating} onFilter={setFilterRating} />
      )}
      {activeTab === 'competitive' && <ReputationCompetitive />}
      {activeTab === 'topics' && <ReputationTopics />}

      {testimonialModalOpen && <TestimonialModal onClose={() => setTestimonialModalOpen(false)} />}
    </div>
  );
}
