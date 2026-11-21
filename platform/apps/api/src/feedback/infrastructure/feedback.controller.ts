import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AnalyzeCompetitivePositionUseCase } from '../application/analyze-competitive-position.use-case';
import type {
  AnalyzeCompetitivePositionQuery,
  CompetitivePositionResult,
} from '../application/analyze-competitive-position.use-case';
import { AnalyzeCompetitiveMarketGapsUseCase } from '../application/analyze-competitive-market-gaps.use-case';
import type {
  AnalyzeMarketGapsQuery,
  MarketGapAnalysisResult,
} from '../application/analyze-competitive-market-gaps.use-case';
import { CompetitorBenchmark, CompetitorPlatform } from '../domain/competitor-benchmark.entity';
import type { CompetitorBenchmarkRepository } from '../application/ports';
import { Inject } from '@nestjs/common';

@Controller('admin/feedback')
export class AdminFeedbackController {
  constructor(
    private readonly analyzeCompetitivePositionUseCase: AnalyzeCompetitivePositionUseCase,
    private readonly analyzeCompetitiveMarketGapsUseCase: AnalyzeCompetitiveMarketGapsUseCase,
    @Inject('CompetitorBenchmarkRepository')
    private readonly competitorRepo: CompetitorBenchmarkRepository
  ) {}

  @Post('competitive-analysis')
  async analyzePosition(
    @Body() query: AnalyzeCompetitivePositionQuery
  ): Promise<CompetitivePositionResult> {
    return this.analyzeCompetitivePositionUseCase.execute(query);
  }

  @Post('market-gaps')
  async analyzeMarketGaps(@Body() query: AnalyzeMarketGapsQuery): Promise<MarketGapAnalysisResult> {
    return this.analyzeCompetitiveMarketGapsUseCase.execute(query);
  }

  @Post('competitors')
  async saveBenchmark(
    @Body()
    body: {
      id: string;
      locationId: string;
      competitorName: string;
      platform: CompetitorPlatform;
      rating: number;
      reviewCount: number;
      averageHaircutPrice: number;
      sentimentScore: number;
    }
  ): Promise<{ success: boolean }> {
    const benchmark = new CompetitorBenchmark(body);
    await this.competitorRepo.save(benchmark);
    return { success: true };
  }

  @Get('competitors/:locationId')
  async getCompetitors(@Param('locationId') locationId: string): Promise<CompetitorBenchmark[]> {
    return this.competitorRepo.findByLocationId(locationId);
  }
}
