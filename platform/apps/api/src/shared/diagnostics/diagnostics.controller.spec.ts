import { Test } from '@nestjs/testing';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsModule } from './diagnostics.module';
import { ErrorTrackerService } from '../logging/error-tracker.service';

describe('DiagnosticsController (/diagnostics)', () => {
  it('returns process health and diagnostic metrics with telemetry and error tracking', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [DiagnosticsModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const controller = moduleRef.get(DiagnosticsController);
    const res = controller.check();

    expect(res.status).toBe('ok');
    expect(res.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(res.memory).toBeDefined();
    expect(res.cpuUsage).toBeDefined();
    expect(res.nodeVersion).toBeDefined();
    expect(res.platform).toBeDefined();
    expect(res.env).toBeDefined();
    expect(typeof res.env.otelConfigured).toBe('boolean');
    expect(res.telemetry).toBeDefined();
    expect(res.telemetry?.routes).toBeDefined();
    expect(typeof res.telemetry?.bookingSlow).toBe('number');
    expect(res.errorTracking).toBeDefined();
    expect(typeof res.errorTracking?.totalRecorded).toBe('number');

    await app.close();
  });

  it('includes recorded errors in errorTracking snapshot', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [DiagnosticsModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const controller = moduleRef.get(DiagnosticsController);
    const errorTracker = moduleRef.get(ErrorTrackerService);
    errorTracker.recordError('DiagnosticTest', 'Test failure message', undefined, 500);

    const res = controller.check();
    expect(res.errorTracking?.totalRecorded).toBeGreaterThan(0);
    expect(res.errorTracking?.recentErrors.some(e => e.message === 'Test failure message')).toBe(true);

    await app.close();
  });
});
