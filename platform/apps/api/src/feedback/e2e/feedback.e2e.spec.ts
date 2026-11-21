import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FeedbackModule } from '../infrastructure/feedback.module';

describe('Feedback & Competitive Intelligence (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [FeedbackModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('analyzes competitive position and saves competitor benchmark', async () => {
    const http = app.getHttpServer();

    // Analyze competitive position
    const analysisRes = await request(http)
      .post('/admin/feedback/competitive-analysis')
      .send({
        locationId: 'loc-center',
        ourRating: 4.9,
        ourAveragePrice: 700,
      })
      .expect(201);

    expect(analysisRes.body.locationId).toBe('loc-center');
    expect(analysisRes.body.marketAverageRating).toBe(4.65);
    expect(analysisRes.body.ratingDelta).toBe(0.25);
    expect(analysisRes.body.priceCompetitiveness).toBe('CHEAPER');
    expect(analysisRes.body.competitorInsights.length).toBe(2);

    // Save a new competitor benchmark
    await request(http)
      .post('/admin/feedback/competitors')
      .send({
        id: 'comp-3',
        locationId: 'loc-center',
        competitorName: 'Modern Fade Studio',
        platform: 'GOOGLE_MAPS',
        rating: 4.7,
        reviewCount: 95,
        averageHaircutPrice: 800,
        sentimentScore: 0.81,
      })
      .expect(201);

    // Get updated competitors list
    const listRes = await request(http).get('/admin/feedback/competitors/loc-center').expect(200);

    expect(listRes.body.length).toBe(3);
    expect(listRes.body[2].competitorName).toBe('Modern Fade Studio');
  });
});
