/* eslint-disable max-params -- 1 signature whose 7-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { AnalyzeReviewFeedbackUseCase } from '../application/analyze-review.use-case';
import { ProcessReviewEscalationUseCase } from '../application/process-review-escalation.use-case';
import {
  CalculateReputationHealthUseCase,
  ReputationHealthReport,
} from '../application/calculate-reputation-health.use-case';
import {
  AnalyzeReviewSentimentAlertUseCase,
  SentimentAlertReport,
} from '../application/analyze-review-sentiment-alert.use-case';
import {
  AnalyzeCompetitorGapUseCase,
  CompetitorGapReport,
} from '../application/analyze-competitor-gap.use-case';
import { GenerateReviewResponseUseCase } from '../application/generate-review-response.use-case';
import type {
  GenerateResponseInput,
  GenerateResponseOutput,
} from '../application/generate-review-response.use-case';
import type { ReputationRepository } from '../application/ports';
import type { ReviewItem, CompetitorBenchmark } from '../domain/reputation.entity';

@Controller('admin/reputation')
export class AdminReputationController {
  constructor(
    private readonly analyzeReviewUseCase: AnalyzeReviewFeedbackUseCase,
    private readonly processReviewEscalationUseCase: ProcessReviewEscalationUseCase,
    private readonly calculateReputationHealthUseCase: CalculateReputationHealthUseCase,
    private readonly analyzeReviewSentimentAlertUseCase: AnalyzeReviewSentimentAlertUseCase,
    private readonly analyzeCompetitorGapUseCase: AnalyzeCompetitorGapUseCase,
    private readonly generateReviewResponseUseCase: GenerateReviewResponseUseCase,
    @Inject('ReputationRepository')
    private readonly reputationRepo: ReputationRepository
  ) {}

  @Post('reviews')
  async submitReview(@Body() review: ReviewItem) {
    const res = await this.analyzeReviewUseCase.execute(review);
    const escalation = await this.processReviewEscalationUseCase.execute(review);
    return { success: true, ...res, ...escalation };
  }

  @Post('generate-response')
  generateResponse(@Body() input: GenerateResponseInput): GenerateResponseOutput {
    return this.generateReviewResponseUseCase.execute(input);
  }

  @Get('competitors/:locationId')
  async getCompetitors(@Param('locationId') locationId: string): Promise<CompetitorBenchmark[]> {
    return this.reputationRepo.getCompetitorBenchmarks(locationId);
  }

  @Get('competitor-gap/:locationId')
  async getCompetitorGap(@Param('locationId') locationId: string): Promise<CompetitorGapReport> {
    return this.analyzeCompetitorGapUseCase.execute(locationId);
  }

  @Get('health/:locationId')
  async getHealth(@Param('locationId') locationId: string): Promise<ReputationHealthReport> {
    return this.calculateReputationHealthUseCase.execute(locationId);
  }

  @Get('sentiment-alerts/:locationId')
  async getSentimentAlerts(@Param('locationId') locationId: string): Promise<SentimentAlertReport> {
    return this.analyzeReviewSentimentAlertUseCase.execute(locationId);
  }
}
