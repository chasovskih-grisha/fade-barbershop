import { RequestTelemetryInterceptor } from './request-telemetry.interceptor';
import { ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('RequestTelemetryInterceptor', () => {
  let interceptor: RequestTelemetryInterceptor;
  let loggerSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new RequestTelemetryInterceptor();
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs completed requests with duration, status code, and request id', (done) => {
    const setHeaderMock = jest.fn();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/health',
          headers: { 'x-request-id': 'req-123' },
        }),
        getResponse: () => ({ statusCode: 200, setHeader: setHeaderMock }),
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () => of('ok'),
    };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(setHeaderMock).toHaveBeenCalledWith('X-Request-Id', 'req-123');
        expect(loggerSpy).toHaveBeenCalled();
        const payload = JSON.parse(loggerSpy.mock.calls[0][0]);
        expect(payload).toMatchObject({
          event: 'http_request_completed',
          method: 'GET',
          url: '/health',
          statusCode: 200,
          requestId: 'req-123',
        });
        expect(typeof payload.durationMs).toBe('number');
        done();
      },
    });
  });

  it('logs failed requests with error message, status code, and request id', (done) => {
    const setHeaderMock = jest.fn();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/booking',
          headers: {},
        }),
        getResponse: () => ({ statusCode: 500, setHeader: setHeaderMock }),
      }),
    } as unknown as ExecutionContext;

    const testError = new Error('Slot conflict');
    const next: CallHandler = {
      handle: () => throwError(() => testError),
    };

    interceptor.intercept(context, next).subscribe({
      error: () => {
        expect(setHeaderMock).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();
        const payload = JSON.parse(errorSpy.mock.calls[0][0]);
        expect(payload).toMatchObject({
          event: 'http_request_failed',
          method: 'POST',
          url: '/booking',
          statusCode: 500,
          error: 'Slot conflict',
        });
        expect(typeof payload.requestId).toBe('string');
        done();
      },
    });
  });
});
