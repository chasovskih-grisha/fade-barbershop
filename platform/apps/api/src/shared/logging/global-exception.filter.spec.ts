import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ErrorTrackerService } from './error-tracker.service';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let errorTracker: ErrorTrackerService;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    errorTracker = new ErrorTrackerService();
    filter = new GlobalExceptionFilter(errorTracker);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockArgumentsHost = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/test' }),
        getResponse: () => mockResponse,
        getNext: () => ({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('records HttpException and sends response', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalled();
    const snapshot = errorTracker.snapshot();
    expect(snapshot.totalRecorded).toBe(1);
    expect(snapshot.recentErrors[0]?.message).toBe('Bad Request');
    expect(snapshot.recentErrors[0]?.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('records non-HttpException as 500 Internal Server Error', () => {
    const exception = new Error('Database connection failed');
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalled();
    const snapshot = errorTracker.snapshot();
    expect(snapshot.totalRecorded).toBe(1);
    expect(snapshot.recentErrors[0]?.message).toBe('Database connection failed');
    expect(snapshot.recentErrors[0]?.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
