import { CompetitorBenchmark } from '../domain/competitor-benchmark.entity';

export interface FeedbackRepository {
  // Feedback data operations
}

export interface CompetitorBenchmarkRepository {
  findByLocationId(locationId: string): Promise<CompetitorBenchmark[]>;
  save(benchmark: CompetitorBenchmark): Promise<void>;
}

