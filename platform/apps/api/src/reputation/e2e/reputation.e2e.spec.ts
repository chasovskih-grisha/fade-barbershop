import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ReputationModule } from '../infrastructure/reputation.module';

describe('Reputation & Competitive Intelligence (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ReputationModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('submits review, computes sentiment, fetches competitor benchmarks, health report, and competitor gap', async () => {
    const http = app.getHttpServer();

    // Submit review 1 (promoter)
    const res1 = await request(http)
      .post('/admin/reputation/reviews')
      .send({
        id: 'rev-1',
        locationId: 'loc-podil',
        clientId: 'client-1',
        rating: 5,
        text: 'Absolute best haircut in town!',
        sentimentScore: 0.9,
      })
      .expect(201);

    expect(res1.body.success).toBe(true);
    expect(res1.body.sentiment).toBe('POSITIVE');
    expect(res1.body.npsScore).toBe(100);

    // Submit review 2 (detractor)
    const res2 = await request(http)
      .post('/admin/reputation/reviews')
      .send({
        id: 'rev-2',
        locationId: 'loc-podil',
        clientId: 'client-2',
        rating: 2,
        text: 'Waited 30 minutes past appointment time.',
        sentimentScore: -0.5,
      })
      .expect(201);

    expect(res2.body.success).toBe(true);
    expect(res2.body.sentiment).toBe('NEGATIVE');
    expect(res2.body.npsScore).toBe(0);

    // Fetch competitor benchmarks
    const benchmarks = await request(http)
      .get('/admin/reputation/competitors/loc-podil')
      .expect(200);

    expect(benchmarks.body).toBeInstanceOf(Array);
    expect(benchmarks.body.length).toBeGreaterThan(0);
    expect(benchmarks.body[0].competitorName).toBeDefined();

    // Fetch competitor gap analysis
    const gapReport = await request(http)
      .get('/admin/reputation/competitor-gap/loc-podil')
      .expect(200);

    expect(gapReport.body.ourAverageRating).toBe(3.5);
    expect(gapReport.body.topCompetitorName).toBe('Sharp & Classic Barbers');
    expect(gapReport.body.marketPositioning).toBeDefined();
    expect(gapReport.body.strategicRecommendation).toBeDefined();

    // Fetch reputation health report
    const health = await request(http).get('/admin/reputation/health/loc-podil').expect(200);

    expect(health.body.totalReviews).toBe(2);
    expect(health.body.averageRating).toBe(3.5);
    expect(health.body.riskStatus).toBe('HIGH_RISK');
    expect(health.body.actionableInsight).toBeDefined();
  });
});
